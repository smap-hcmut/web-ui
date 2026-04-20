'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  X,
  Minus,
  Send,
  MessageSquare,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import clsx from 'clsx';
import type { BotResponseBlock } from '@/lib/types';
import { useScope } from '@/components/ScopeProvider';
import { knowledgeApi, type ChatResponse } from '@/lib/api/knowledge';

/* ─── Default suggestions (used when API has none or no campaign selected) ─── */

const defaultSuggestions = [
  { id: 'sq1', text: 'Tóm tắt sentiment tuần này' },
  { id: 'sq2', text: 'Top 5 bài viết có engagement cao nhất' },
  { id: 'sq3', text: 'So sánh hiệu suất giữa các platform' },
  { id: 'sq4', text: 'Xu hướng keyword nổi bật' },
];

/** Convert knowledge-srv chat response to BotResponseBlock[] */
function chatResponseToBlocks(resp: ChatResponse): BotResponseBlock[] {
  const blocks: BotResponseBlock[] = [];

  // Main answer text
  if (resp.answer) {
    blocks.push({ type: 'text', content: resp.answer });
  }

  // Citations as bullet list
  if (resp.citations && resp.citations.length > 0) {
    blocks.push({
      type: 'bullets',
      items: resp.citations.map(
        (c) => c.url ? `[${c.source}](${c.url}): ${c.content}` : `${c.source}: ${c.content}`,
      ),
    });
  }

  return blocks.length > 0 ? blocks : [{ type: 'text', content: '(No response)' }];
}

/* ─── Types ─── */

type MessageRole = 'user' | 'bot' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  blocks: BotResponseBlock[];
  timestamp: Date;
}

/* ─── Helpers ─── */

let _msgId = 0;
const uid = () => `msg-${++_msgId}-${Date.now()}`;

/* ─── Component ─── */

export function CampaignAssistant() {
  const { activeCampaignId } = useScope();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState(defaultSuggestions);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* Fetch suggestions when campaign changes */
  useEffect(() => {
    if (!activeCampaignId) {
      setSuggestions(defaultSuggestions);
      return;
    }
    let cancelled = false;
    knowledgeApi.suggestions(activeCampaignId).then((items) => {
      if (cancelled) return;
      if (items.length > 0) {
        setSuggestions(items.map((s, i) => ({ id: `sq-${i}`, text: s.query })));
      } else {
        setSuggestions(defaultSuggestions);
      }
    }).catch(() => {
      if (!cancelled) setSuggestions(defaultSuggestions);
    });
    return () => { cancelled = true; };
  }, [activeCampaignId]);

  /* Reset conversation when campaign changes */
  useEffect(() => {
    setConversationId(undefined);
    setMessages([]);
  }, [activeCampaignId]);

  /* auto-scroll on new message */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  /* focus input when panel opens */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  /* clear unread on open */
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  /* ─── Send message ─── */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || typing) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        blocks: [{ type: 'text', content: text.trim() }],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setTyping(true);

      try {
        if (!activeCampaignId) {
          throw new Error('No campaign selected');
        }

        const resp = await knowledgeApi.chat({
          campaign_id: activeCampaignId,
          message: text.trim(),
          conversation_id: conversationId,
        });

        // Track conversation for multi-turn
        if (resp.conversation_id) {
          setConversationId(resp.conversation_id);
        }

        const responseBlocks = chatResponseToBlocks(resp);
        const botMsg: ChatMessage = {
          id: uid(),
          role: 'bot',
          blocks: responseBlocks,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);

        // Update suggestions from response if available
        if (resp.suggestions && resp.suggestions.length > 0) {
          setSuggestions(resp.suggestions.map((s, i) => ({ id: `rs-${i}`, text: s })));
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message
          : (err as { message?: string })?.message || 'Unexpected error';
        const errorBlocks: BotResponseBlock[] = [
          { type: 'text', content: `Sorry, I encountered an error: ${errMsg}. Please try again.` },
        ];
        const botMsg: ChatMessage = {
          id: uid(),
          role: 'bot',
          blocks: errorBlocks,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } finally {
        setTyping(false);
        if (!open) setHasUnread(true);
      }
    },
    [typing, open, activeCampaignId, conversationId],
  );

  /* ─── Render helpers ─── */

  const renderBlocks = (blocks: BotResponseBlock[]) =>
    blocks.map((block, i) => {
      if (block.type === 'text') {
        return (
          <p key={i} className="text-[13px] leading-relaxed">
            {block.content}
          </p>
        );
      }
      if (block.type === 'bullets' && block.items) {
        return (
          <ul key={i} className="space-y-1 text-[13px] leading-relaxed">
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        );
      }
      if (block.type === 'stats' && block.stats) {
        return (
          <div key={i} className="grid grid-cols-3 gap-2 my-2">
            {block.stats.map((stat, j) => (
              <div
                key={j}
                className="rounded-lg p-2 text-center"
                style={{ background: 'var(--bg-inset)' }}
              >
                <div
                  className="text-[10px] font-medium mb-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {stat.label}
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {stat.value}
                </div>
                {stat.change !== undefined && (
                  <div
                    className="text-[10px] font-medium flex items-center justify-center gap-0.5 mt-0.5"
                    style={{
                      color:
                        stat.change >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {stat.change >= 0 ? '+' : ''}
                    {stat.change}%
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      return null;
    });

  /* ─── Keyboard ─── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* ─── JSX ─── */

  return (
    <>
      {/* ── FAB ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'fixed bottom-20 right-6 z-[90] w-14 h-14 rounded-full flex items-center justify-center',
          'transition-all duration-300 ease-out',
          open
            ? 'scale-0 opacity-0 pointer-events-none'
            : 'scale-100 opacity-100 animate-[fabBounce_2s_ease_0.5s_1]',
        )}
        style={{
          background: 'var(--accent)',
          boxShadow:
            '0 4px 20px rgba(99, 102, 241, 0.4), 0 0 0 0 rgba(99, 102, 241, 0.3)',
          color: '#fff',
        }}
        aria-label="Open Campaign Assistant"
      >
        <Bot className="w-6 h-6" />
        {/* unread badge */}
        {hasUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold animate-[fabPulse_2s_ease_infinite]"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            1
          </span>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={clsx(
          'fixed z-[95] flex flex-col rounded-2xl overflow-hidden',
          'transition-all duration-300 ease-out',
          open
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none',
          /* responsive */
          'bottom-20 right-6 w-[400px] h-[550px]',
          'max-[480px]:bottom-0 max-[480px]:right-0 max-[480px]:w-full max-[480px]:h-full max-[480px]:rounded-none',
        )}
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 0 0 1px var(--border-subtle)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              Campaign Assistant
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              AI-powered insights
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Messages area ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
          style={{ overscrollBehavior: 'contain' }}
        >
          {messages.length === 0 && !typing && (
            <div className="flex flex-col items-center justify-center h-full gap-4 animate-[fadeIn_400ms_ease]">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                <Bot className="w-6 h-6" />
              </div>
              <p
                className="text-sm text-center max-w-[260px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Xin chào! Tôi có thể giúp bạn phân tích dữ liệu campaign.
                Thử hỏi tôi:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => sendMessage(q.text)}
                    className="text-[12px] px-3 py-1.5 rounded-full transition-all duration-200"
                    style={{
                      background: 'var(--bg-inset)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--accent-subtle)';
                      e.currentTarget.style.color = 'var(--accent)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-inset)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === 'system') {
              return (
                <div
                  key={msg.id}
                  className="text-center text-[11px] py-1 animate-[fadeIn_300ms_ease]"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {msg.blocks[0]?.content}
                </div>
              );
            }

            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={clsx(
                  'flex gap-2 animate-[fadeIn_300ms_ease]',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                {!isUser && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Bot className="w-3 h-3" />
                  </div>
                )}
                <div
                  className={clsx(
                    'rounded-2xl px-3.5 py-2.5 max-w-[85%] space-y-2',
                    isUser ? 'rounded-br-md' : 'rounded-bl-md',
                  )}
                  style={{
                    background: isUser
                      ? 'var(--accent)'
                      : 'var(--bg-elevated)',
                    color: isUser ? '#fff' : 'var(--text-primary)',
                    border: isUser
                      ? 'none'
                      : '1px solid var(--border-subtle)',
                  }}
                >
                  {renderBlocks(msg.blocks)}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-2 items-start animate-[fadeIn_200ms_ease]">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                }}
              >
                <Bot className="w-3 h-3" />
              </div>
              <div
                className="rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-[typingDot_1.4s_ease_infinite]"
                  style={{
                    background: 'var(--text-muted)',
                    animationDelay: '0ms',
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-[typingDot_1.4s_ease_infinite]"
                  style={{
                    background: 'var(--text-muted)',
                    animationDelay: '200ms',
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-[typingDot_1.4s_ease_infinite]"
                  style={{
                    background: 'var(--text-muted)',
                    animationDelay: '400ms',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div
          className="shrink-0 px-3 pb-3 pt-2"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về campaign..."
              rows={1}
              className="flex-1 bg-transparent resize-none text-[13px] leading-snug outline-none max-h-24"
              style={{
                color: 'var(--text-primary)',
                caretColor: 'var(--accent)',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className={clsx(
                'p-1.5 rounded-lg transition-all duration-200 shrink-0 mb-0.5',
                input.trim() && !typing
                  ? 'opacity-100'
                  : 'opacity-30 cursor-not-allowed',
              )}
              style={{
                background:
                  input.trim() && !typing
                    ? 'var(--accent)'
                    : 'transparent',
                color:
                  input.trim() && !typing ? '#fff' : 'var(--text-muted)',
                borderRadius: '10px',
              }}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
