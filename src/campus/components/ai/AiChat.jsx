/**
 * @file AiChat.jsx
 * @description RAG chat panel (Feature 1) — the only SSE surface of the app.
 *
 * Streams a turn over streamAiChat (message_start / delta / citations / done /
 * error), shows verified citations per assistant message, keeps a history
 * drawer of past conversations (GET /ai/conversations) and lets the user open
 * one (GET /ai/conversations/:id). Answers stream in the user's preferred
 * language (resolved server-side). Errors — budget, feature-not-in-plan,
 * upstream — are surfaced inline without breaking the thread.
 *
 * The AI never writes to the ERP: it answers over authorized documents only.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Paper, Typography, TextField, IconButton, Button, Divider,
  List, ListItemButton, ListItemText, CircularProgress, Alert, Tooltip,
  Avatar, useTheme, alpha,
} from '@mui/material';
import {
  Send, Stop, Add, History, SmartToy, Person, AutoAwesome,
} from '@mui/icons-material';

import CitationList from './CitationList';
import {
  streamAiChat, listAiConversations, getAiConversation,
} from '../../../services/aiService';
import { extractAiError, errorKey, isUnavailableError } from './aiConstants';
import AiUnavailable from './AiUnavailable';

/** One rendered chat bubble. */
function MessageBubble({ role, content, citations, streaming }) {
  const theme = useTheme();
  const isUser = role === 'user';
  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{ flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}
    >
      <Avatar
        sx={{
          width: 30, height: 30, mt: 0.25,
          bgcolor: isUser ? 'primary.main' : alpha(theme.palette.secondary.main, 0.15),
          color: isUser ? 'primary.contrastText' : 'secondary.main',
        }}
      >
        {isUser ? <Person sx={{ fontSize: 18 }} /> : <SmartToy sx={{ fontSize: 18 }} />}
      </Avatar>
      <Box sx={{ maxWidth: '82%', minWidth: 0 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5, borderRadius: 2,
            bgcolor: isUser ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
            borderColor: isUser ? alpha(theme.palette.primary.main, 0.3) : 'divider',
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {content}
            {streaming && (
              <Box component="span" sx={{ opacity: 0.5, animation: 'blink 1s step-start infinite' }}>▍</Box>
            )}
          </Typography>
        </Paper>
        {Array.isArray(citations) && citations.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <CitationList items={citations} dense />
          </Box>
        )}
      </Box>
    </Stack>
  );
}

export default function AiChat() {
  const theme = useTheme();
  const { t } = useTranslation('ai');

  const [messages, setMessages] = useState([]);       // { role, content, citations }
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);           // { code, message }
  const [blocked, setBlocked] = useState(null);       // full-panel error code

  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const streamRef = useRef(null);
  const scrollRef = useRef(null);

  // Keep the thread pinned to the latest message while streaming.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Abort any in-flight stream on unmount.
  useEffect(() => () => streamRef.current?.abort(), []);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    listAiConversations({ page: 1, limit: 30 })
      .then((res) => setConversations(res.data?.data ?? []))
      .catch((err) => {
        const { code } = extractAiError(err);
        if (isUnavailableError(code)) setBlocked(code);
      })
      .finally(() => setHistoryLoading(false));
  }, []);

  const toggleHistory = () => {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next) loadHistory();
  };

  const openConversation = (id) => {
    if (streaming) return;
    setError(null);
    getAiConversation(id)
      .then((res) => {
        const conv = res.data?.data;
        setConversationId(conv?.id ?? id);
        setMessages((conv?.messages ?? []).map((m) => ({
          role: m.role, content: m.content, citations: m.citations,
        })));
        setHistoryOpen(false);
      })
      .catch((err) => setError(extractAiError(err)));
  };

  const newConversation = () => {
    if (streaming) return;
    streamRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const send = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput('');

    // Optimistic user bubble + an empty assistant bubble we fill as deltas land.
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text, citations: [] },
      { role: 'assistant', content: '', citations: [] },
    ]);
    setStreaming(true);

    const patchAssistant = (patch) =>
      setMessages((prev) => {
        const next = [...prev];
        const cur = next[assistantIndex];
        if (cur) next[assistantIndex] = { ...cur, ...patch(cur) };
        return next;
      });

    streamRef.current = streamAiChat(
      { message: text, conversationId },
      {
        onMessageStart: ({ conversationId: id }) => { if (id) setConversationId(id); },
        onDelta: ({ text: delta }) => patchAssistant((cur) => ({ content: cur.content + (delta || '') })),
        onCitations: ({ items }) => patchAssistant(() => ({ citations: items || [] })),
        onDone: () => setStreaming(false),
        onError: ({ code, message }) => {
          setStreaming(false);
          if (isUnavailableError(code)) { setBlocked(code); return; }
          setError({ code, message });
          // Drop the empty assistant bubble if nothing streamed.
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.content) return prev.slice(0, -1);
            return prev;
          });
        },
      },
    );
  };

  const stop = () => {
    streamRef.current?.abort();
    setStreaming(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (blocked) return <AiUnavailable code={blocked} onRetry={() => setBlocked(null)} />;

  return (
    <Box sx={{ height: '100%', display: 'flex', minHeight: 0 }}>
      {/* ── History drawer (inline column) ────────────────────────────────── */}
      {historyOpen && (
        <Paper
          variant="outlined"
          sx={{
            width: 260, flexShrink: 0, mr: 1.5, borderRadius: 2,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.25 }}>
            <Typography variant="subtitle2" fontWeight={700}>{t('chat.history')}</Typography>
            <Button size="small" startIcon={<Add />} onClick={newConversation} sx={{ textTransform: 'none' }}>
              {t('chat.new')}
            </Button>
          </Stack>
          <Divider />
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {historyLoading ? (
              <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={22} /></Stack>
            ) : conversations.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', p: 2 }}>
                {t('chat.noHistory')}
              </Typography>
            ) : (
              <List dense disablePadding>
                {conversations.map((c) => (
                  <ListItemButton
                    key={c.id}
                    selected={c.id === conversationId}
                    onClick={() => openConversation(c.id)}
                  >
                    <ListItemText
                      primary={c.title || t('chat.untitled')}
                      secondary={t('chat.messageCount', { count: c.messageCount ?? 0 })}
                      primaryTypographyProps={{ noWrap: true, fontSize: 13, fontWeight: 600 }}
                      secondaryTypographyProps={{ fontSize: 11 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      )}

      {/* ── Main chat column ──────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {/* Toolbar */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Tooltip title={t('chat.toggleHistory')}>
            <IconButton size="small" onClick={toggleHistory} color={historyOpen ? 'primary' : 'default'}>
              <History />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('chat.new')}>
            <IconButton size="small" onClick={newConversation}><Add /></IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">{t('chat.groundedNote')}</Typography>
        </Stack>

        {/* Thread */}
        <Box
          ref={scrollRef}
          sx={{
            flex: 1, overflow: 'auto', minHeight: 0, px: { xs: 0.5, md: 1 }, py: 1,
            '@keyframes blink': { '50%': { opacity: 0 } },
          }}
        >
          {messages.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: '100%', textAlign: 'center', color: 'text.secondary' }}>
              <AutoAwesome sx={{ fontSize: 44, color: alpha(theme.palette.secondary.main, 0.5) }} />
              <Typography variant="h6" fontWeight={700} color="text.primary">{t('chat.emptyTitle')}</Typography>
              <Typography variant="body2" sx={{ maxWidth: 420 }}>{t('chat.emptyHint')}</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  role={m.role}
                  content={m.content}
                  citations={m.citations}
                  streaming={streaming && i === messages.length - 1 && m.role === 'assistant'}
                />
              ))}
            </Stack>
          )}
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }} onClose={() => setError(null)}>
            {t(errorKey(error.code), { defaultValue: error.message })}
          </Alert>
        )}

        {/* Composer */}
        <Paper variant="outlined" sx={{ mt: 1, p: 1, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={5}
              size="small"
              placeholder={t('chat.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming}
              inputProps={{ maxLength: 4000 }}
              sx={{ '& fieldset': { border: 'none' } }}
            />
            {streaming ? (
              <Tooltip title={t('chat.stop')}>
                <IconButton color="error" onClick={stop}><Stop /></IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={t('chat.send')}>
                <span>
                  <IconButton color="primary" onClick={send} disabled={!input.trim()}><Send /></IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
