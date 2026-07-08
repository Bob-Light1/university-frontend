/**
 * @file aiService.js
 * @description API service layer for the AI gateway (/api/ai, Phase 3 M4).
 *
 * Mirrors the frozen contracts of PHASE3_AI_DESIGN.md Annexe B. All endpoints
 * require authentication; campus scoping and entitlement (plan/features/
 * budget) are enforced server-side — this service duplicates no access logic.
 *
 * The chat endpoint is the ONLY SSE stream of the app: axios cannot consume
 * it in the browser, so streamAiChat uses fetch + ReadableStream with the
 * same Bearer token as the axios instance.
 */

import api from '../api/axiosInstance';
import { API_BASE_URL } from '../config/env';

// ─── JSON endpoints (project response shape { success, message, data }) ──────

/**
 * Hybrid semantic search with verified citations.
 * @param {Object} payload - { query: string 1..500, types?: ['document'], limit?: number ≤ 50 }
 */
export const searchAi = (payload) =>
  api.post('/ai/search', payload);

/**
 * Paginated chat history of the current user (sendPaginated shape).
 * @param {Object} params - { page?, limit? }
 */
export const listAiConversations = (params = {}) =>
  api.get('/ai/conversations', { params });

/**
 * One conversation with its messages and citations.
 * @param {string} id - Conversation uuid (ai-service id, not a Mongo ObjectId).
 */
export const getAiConversation = (id) =>
  api.get(`/ai/conversations/${id}`);

/**
 * Monthly AI consumption gauge of the campus (CAMPUS_MANAGER+).
 * data = { period, plan, features, tokensIn, tokensOut, budget, remaining } —
 * `features` are the campus's effective toggles (may override the plan preset).
 * @param {Object} params - { campusId? } (global roles narrowing to one campus)
 */
export const getAiUsage = (params = {}) =>
  api.get('/ai/usage', { params });

/**
 * AI-assisted descriptive summary over ERP aggregates (Feature 2, M5).
 * data = { figures, narrative, snapshotId, generatedAt } — figures are ERP
 * numbers, the narrative is in the user's preferred language.
 * @param {string} report - 'class-performance' | 'attendance-summary' | 'dropout-risk'
 *   (backend AI_ANALYTICS_REPORTS is the source of truth).
 * @param {Object} params - Report filters, validated per report server-side
 *   (e.g. { academicYear: '2025-2026', semester: 'S1' }).
 */
export const runAiAnalytics = (report, params = {}) =>
  api.post(`/ai/analytics/${report}`, { params });

/**
 * Business advisor proposals (M5b — ADMIN/DIRECTOR/CAMPUS_MANAGER, campus
 * feature 'advisors'). data = { proposals, engine } where each proposal is
 * { title, rationale, evidence, suggestedAction } — suggestedAction is a
 * PROPOSAL to render as a normal permission-gated ERP button: the AI never
 * executes it (human-in-the-loop).
 * @param {string} advisor - 'finance' | 'academic' | 'marketing'
 *   (backend AI_ADVISORS is the source of truth).
 * @param {Object} params - Advisor filters, whitelisted server-side
 *   (finance: { months? }, academic: { academicYear?, semester? }).
 */
export const runAiAdvisor = (advisor, params = {}) =>
  api.post(`/ai/advisors/${advisor}`, { params });

// ─── Chat (SSE) ───────────────────────────────────────────────────────────────

/** Parses one raw SSE block into { event, data } (null for keep-alives). */
const parseSseBlock = (block) => {
  let event = null;
  let data = null;
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) event = line.slice(7).trim();
    else if (line.startsWith('data: ')) data = line.slice(6);
  }
  if (!event) return null; // comment / keep-alive block
  try {
    return { event, data: data ? JSON.parse(data) : {} };
  } catch {
    return null;
  }
};

/**
 * Streams a chat turn over SSE (Annexe B: message_start / delta / citations /
 * done / error). Handlers are all optional; onError also receives transport
 * and HTTP failures (shape { code, message }).
 *
 * @param {Object} payload - { message: string 1..4000, conversationId?: string|null }
 * @param {Object} handlers
 * @param {Function} [handlers.onMessageStart] - ({ conversationId })
 * @param {Function} [handlers.onDelta]        - ({ text })
 * @param {Function} [handlers.onCitations]    - ({ items })
 * @param {Function} [handlers.onDone]         - ({ usage, profile })
 * @param {Function} [handlers.onError]        - ({ code, message })
 * @returns {{ abort: () => void, finished: Promise<void> }} abort() cancels
 *   the stream (the backend aborts the upstream LLM call).
 */
export const streamAiChat = (payload, handlers = {}) => {
  const controller = new AbortController();
  const emitError = (code, message) => {
    if (handlers.onError) handlers.onError({ code, message });
  };

  const finished = (async () => {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          message: payload.message,
          conversationId: payload.conversationId ?? null,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error.name !== 'AbortError') emitError('NETWORK', error.message);
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('text/event-stream')) {
      // Entitlement / validation / upstream failures arrive as project JSON:
      // { success: false, message, errors: { code } } (sendError shape).
      let body = null;
      try {
        body = await response.json();
      } catch {
        /* non-JSON error body */
      }
      emitError(body?.errors?.code || 'HTTP_ERROR', body?.message || `HTTP ${response.status}`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let separator;
        while ((separator = buffer.indexOf('\n\n')) !== -1) {
          const parsed = parseSseBlock(buffer.slice(0, separator));
          buffer = buffer.slice(separator + 2);
          if (!parsed) continue;
          if (parsed.event === 'message_start') handlers.onMessageStart?.(parsed.data);
          else if (parsed.event === 'delta') handlers.onDelta?.(parsed.data);
          else if (parsed.event === 'citations') handlers.onCitations?.(parsed.data);
          else if (parsed.event === 'done') handlers.onDone?.(parsed.data);
          else if (parsed.event === 'error') emitError(parsed.data.code, parsed.data.message);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') emitError('STREAM', error.message);
    }
  })();

  return { abort: () => controller.abort(), finished };
};
