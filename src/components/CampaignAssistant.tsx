'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Bot,
  X,
  Send,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  User as UserIcon,
  ChevronDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import clsx from 'clsx';
import type { BotResponseBlock } from '@/lib/types';
import { useScope } from '@/components/ScopeProvider';
import { useAssistant } from '@/components/AssistantProvider';
import { ChatMarkdown } from '@/components/ChatMarkdown';
import { knowledgeApi, type ChatResponse } from '@/lib/api/knowledge';
import { useCampaigns } from '@/lib/hooks';
import { useNotificationStore, type NotificationSeverity } from '@/lib/stores';

/* ─── !noti command parser ─── */

const NOTI_SEVERITIES: NotificationSeverity[] = ['info', 'success', 'warning', 'critical'];
const NOTI_ALIASES: Record<string, NotificationSeverity> = {
  info: 'info',
  success: 'success',
  ok: 'success',
  warning: 'warning',
  warn: 'warning',
  critical: 'critical',
  error: 'critical',
  crit: 'critical',
};

interface ParsedNotiCommand {
  severity: NotificationSeverity;
  content: string;
  title?: string;
}

/**
 * Parse `!noti <severity> [content]` or `!noti <severity> "title" content`.
 * Returns null if not a !noti command.
 * Returns { error } if malformed.
 */
function parseNotiCommand(
  text: string,
): ParsedNotiCommand | { error: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('!noti')) return null;

  const rest = trimmed.slice(5).trim();
  if (!rest) {
    return {
      error: `Usage: !noti <${NOTI_SEVERITIES.join('|')}> [content]`,
    };
  }

  const [rawSev, ...contentParts] = rest.split(/\s+/);
  const severity = NOTI_ALIASES[rawSev.toLowerCase()];
  if (!severity) {
    return {
      error: `Unknown severity "${rawSev}". Use: ${NOTI_SEVERITIES.join(', ')}`,
    };
  }

  const content = contentParts.join(' ').trim();
  if (!content) {
    return { error: `Content is required. Example: !noti ${severity} sentiment dropping` };
  }

  // Quoted title: !noti warning "Spike detected" sentiment âm tăng 20%
  const titleMatch = content.match(/^"([^"]+)"\s*(.*)$/);
  if (titleMatch) {
    return {
      severity,
      title: titleMatch[1],
      content: titleMatch[2].trim() || titleMatch[1],
    };
  }

  return { severity, content };
}

/* ─── !demo command — rich content showcase ─── */

const DEMO_MARKDOWN = `### Top posts tuần này

| Platform | Author | Engagement | Trend |
|---|---|---|---|
| TikTok | @nguyenvana | 12.5k | +48% |
| Facebook | Trang A | 8.2k | +12% |
| YouTube | KOL_B | 5.1k | -4% |

**Key insight**: Engagement trên TikTok đang vượt Facebook ~52%. Đây là kênh cần ưu tiên trong tuần tới.

*Ghi chú*: số liệu lấy từ 7 ngày gần nhất, đã lọc bot traffic.

~~Giả thuyết cũ~~ (đã bác bỏ): KOL micro không hiệu quả — thực tế tỷ lệ chuyển đổi cao hơn macro 2.3x.

Dùng <mark>hashtag mới</mark> để track riêng campaign phụ. Có thể tham khảo [hướng dẫn tagging](https://example.com/tagging).

#### Action items
- [x] Xác định 3 KOL tiềm năng
- [x] Chuẩn bị brief nội dung
- [ ] Gửi outreach email
- [ ] Schedule post đầu tiên

#### Code snippet (filter query)
\`\`\`sql
SELECT platform, COUNT(*) AS posts, AVG(engagement) AS avg_eng
FROM posts
WHERE campaign_id = 'camp-1'
  AND created_at > now() - interval '7 days'
GROUP BY platform
ORDER BY avg_eng DESC;
\`\`\`

Inline code: \`activeCampaignId\` được đọc từ URL param \`camp_id\`.

> **Đề xuất**: tăng ngân sách TikTok 20% trong tuần tới; giữ nguyên YouTube; giảm 10% ngân sách Facebook organic.

---

1. Chạy A/B test creative trong 3 ngày
2. Đo lift engagement vs baseline
3. Scale creative thắng
`;

const DEMO_STATS_BLOCKS: BotResponseBlock[] = [
  { type: 'text', content: '### Performance snapshot\n\nSố liệu 24h gần nhất:' },
  {
    type: 'stats',
    stats: [
      { label: 'Posts',       value: '1.2k', change: 18 },
      { label: 'Engagement',  value: '48k',  change: 24 },
      { label: 'Reach',       value: '310k', change: -3 },
    ],
  },
  { type: 'text', content: '**Tóm tắt**: reach giảm nhẹ nhưng engagement tăng mạnh — audience quality cao hơn.' },
];

const DEMO_BULLETS_BLOCKS: BotResponseBlock[] = [
  { type: 'text', content: '**Top 5 keyword** đang trending:' },
  {
    type: 'bullets',
    items: [
      '**back to school** — 2.4k mentions (+85%)',
      '*giảm giá sách* — 1.8k mentions (+42%)',
      '~~flash sale tháng 9~~ — 1.1k (đã kết thúc)',
      '`hashtag:#tuuentambi` — 950 mentions',
      '[Báo cáo đầy đủ](https://example.com/report)',
    ],
  },
];

function buildDemoBlocks(variant: string): BotResponseBlock[] | null {
  const key = variant.trim().toLowerCase();
  if (key === '' || key === 'markdown' || key === 'md') {
    return [{ type: 'text', content: DEMO_MARKDOWN }];
  }
  if (key === 'stats') return DEMO_STATS_BLOCKS;
  if (key === 'bullets') return DEMO_BULLETS_BLOCKS;
  if (key === 'all') {
    return [
      ...DEMO_STATS_BLOCKS,
      ...DEMO_BULLETS_BLOCKS,
      { type: 'text', content: DEMO_MARKDOWN },
    ];
  }
  return null;
}

function parseDemoCommand(text: string): BotResponseBlock[] | { error: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('!demo')) return null;
  const rest = trimmed.slice(5).trim();
  const blocks = buildDemoBlocks(rest);
  if (!blocks) {
    return {
      error: `Unknown demo variant "${rest}". Use: !demo [markdown|stats|bullets|all]`,
    };
  }
  return blocks;
}

/* ─── Default suggestions (used when API has none or no campaign selected) ─── */

const defaultSuggestions = [
  { id: 'sq1', text: 'Khách hàng đang phản hồi gì nổi bật về chiến dịch này?' },
  { id: 'sq2', text: 'Các phản hồi tích cực nổi bật là gì?' },
  { id: 'sq3', text: 'Vấn đề nào được nhắc đến nhiều nhất gần đây?' },
  { id: 'sq4', text: 'Chi tiết phản hồi tiêu cực nổi bật là gì?' },
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
        (c) => {
          const source = 'source' in c && typeof c.source === 'string' ? c.source : '';
          const prefix = c.platform || source || 'Nguồn';
          const sentiment = c.sentiment ? ` (${c.sentiment})` : '';
          return `${prefix}${sentiment}: ${c.content || ''}`;
        },
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
  /** If true, render as error bubble with Retry action */
  error?: boolean;
  /** Original user text that produced this (error) message, used by Retry */
  retryOf?: string;
  /** Follow-up suggestions attached to this bot message */
  suggestions?: string[];
}

/* ─── Helpers ─── */

let _msgId = 0;
const uid = () => `msg-${++_msgId}-${Date.now()}`;

/** Convert blocks back to plain text for clipboard */
function blocksToPlainText(blocks: BotResponseBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'text') return b.content ?? '';
      if (b.type === 'bullets' && b.items) {
        return b.items.map((i) => `- ${i}`).join('\n');
      }
      if (b.type === 'stats' && b.stats) {
        return b.stats
          .map((s) => {
            const change = s.change !== undefined ? ` (${s.change >= 0 ? '+' : ''}${s.change}%)` : '';
            return `${s.label}: ${s.value}${change}`;
          })
          .join('\n');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function formatRelativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatFullTime(d: Date): string {
  return d.toLocaleString();
}

/* ─── Persistence (per-campaign, TTL 4h, cap 100 msgs) ─── */

const PERSIST_PREFIX = 'smap:assistant:v2:chat:';
const PERSIST_TTL_MS = 4 * 60 * 60 * 1000;
const PERSIST_MAX_MESSAGES = 100;

interface PersistedChat {
  messages: ChatMessage[];
  conversationId?: string;
  lastActivity: number;
}

function persistKey(campaignId: string | null) {
  return `${PERSIST_PREFIX}${campaignId ?? '__none__'}`;
}

function loadPersisted(campaignId: string | null): PersistedChat | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(persistKey(campaignId));
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedChat;
    if (Date.now() - data.lastActivity > PERSIST_TTL_MS) {
      localStorage.removeItem(persistKey(campaignId));
      return null;
    }
    // Revive Date objects
    data.messages = data.messages.map((m) => ({
      ...m,
      timestamp: new Date(m.timestamp),
      blocks: m.blocks.map((b) => {
        if (b.type === 'text' && b.content) {
          return {
            ...b,
            content: b.content.replace(/(^|\n)(-\s+)?undefined:/g, '$1$2Nguồn:'),
          };
        }
        if (b.type === 'bullets' && b.items) {
          return {
            ...b,
            items: b.items.map((item) => item.replace(/^undefined:/, 'Nguồn:')),
          };
        }
        return b;
      }),
    }));
    return data;
  } catch {
    return null;
  }
}

function savePersisted(campaignId: string | null, data: PersistedChat) {
  if (typeof window === 'undefined') return;
  try {
    const trimmed: PersistedChat = {
      ...data,
      messages: data.messages.slice(-PERSIST_MAX_MESSAGES),
    };
    localStorage.setItem(persistKey(campaignId), JSON.stringify(trimmed));
  } catch {
    /* quota exceeded or unavailable — ignore */
  }
}

function clearPersisted(campaignId: string | null) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(persistKey(campaignId)); } catch {}
}

/* ─── Component ─── */

export function CampaignAssistant() {
  const { activeCampaignId } = useScope();
  const { open, setOpen, toggleOpen, mode, toggleMode } = useAssistant();
  const isDocked = mode === 'docked';
  const pushNoti = useNotificationStore((s) => s.push);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);

  /* Campaign name for header subtitle */
  const { data: campaignsData } = useCampaigns();
  const campaignName = useMemo(() => {
    if (!activeCampaignId) return null;
    const list = campaignsData?.campaigns ?? [];
    return list.find((c) => c.id === activeCampaignId)?.name ?? null;
  }, [activeCampaignId, campaignsData]);

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

  /* Load persisted chat when campaign changes */
  useEffect(() => {
    const persisted = loadPersisted(activeCampaignId);
    if (persisted) {
      setMessages(persisted.messages);
      setConversationId(persisted.conversationId);
    } else {
      setMessages([]);
      setConversationId(undefined);
    }
  }, [activeCampaignId]);

  /* Save chat to localStorage whenever it changes */
  useEffect(() => {
    if (messages.length === 0) return;
    savePersisted(activeCampaignId, {
      messages,
      conversationId,
      lastActivity: Date.now(),
    });
  }, [messages, conversationId, activeCampaignId]);

  /* Manual reset (user-initiated) */
  const resetConversation = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setInput('');
    setShowResetConfirm(false);
    clearPersisted(activeCampaignId);
  }, [activeCampaignId]);

  /* Smart auto-scroll — only stick to bottom if user is already near it */
  const SCROLL_NEAR_BOTTOM_PX = 80;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setShowScrollDown(false);
    } else {
      // New message arrived while user scrolled up
      if (messages.length > 0) setShowScrollDown(true);
    }
  }, [messages, typing]);

  /* Track whether user is near the bottom of the message list */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handle = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = distance < SCROLL_NEAR_BOTTOM_PX;
      isNearBottomRef.current = near;
      if (near) setShowScrollDown(false);
    };
    el.addEventListener('scroll', handle, { passive: true });
    handle();
    return () => el.removeEventListener('scroll', handle);
  }, [open]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowScrollDown(false);
  }, []);

  /* focus input when panel opens */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  /* auto-grow textarea up to ~5 lines */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const max = 120; // ~5 lines at text-[13px] leading-snug
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, [input]);

  /* clear unread on open */
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  /* Copy bot message to clipboard */
  const copyMessage = useCallback(async (msg: ChatMessage) => {
    const text = blocksToPlainText(msg.blocks);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId((id) => (id === msg.id ? null : id)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  /* Global keyboard shortcuts */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Cmd/Ctrl+K — toggle panel from anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
          // allow native Cmd+K behaviour inside editable fields
          return;
        }
        e.preventDefault();
        toggleOpen();
        return;
      }
      // Esc — close panel
      if (e.key === 'Escape' && open) {
        if (showResetConfirm) {
          setShowResetConfirm(false);
        } else {
          setOpen(false);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, showResetConfirm, toggleOpen, setOpen]);

  /* ─── Core API call (used by both sendMessage and retry) ─── */
  const callChatApi = useCallback(async (userText: string) => {
    setTyping(true);
    try {
      if (!activeCampaignId) {
        throw new Error('No campaign selected');
      }
      const resp = await knowledgeApi.chat({
        campaign_id: activeCampaignId,
        message: userText,
        conversation_id: conversationId,
      });
      if (resp.conversation_id) {
        setConversationId(resp.conversation_id);
      }
      const responseBlocks = chatResponseToBlocks(resp);
      const suggestionList = resp.suggestions && resp.suggestions.length > 0
        ? resp.suggestions.slice(0, 4)
        : undefined;
      const botMsg: ChatMessage = {
        id: uid(),
        role: 'bot',
        blocks: responseBlocks,
        timestamp: new Date(),
        suggestions: suggestionList,
      };
      setMessages((prev) => [...prev, botMsg]);
      if (suggestionList) {
        setSuggestions(suggestionList.map((s, i) => ({ id: `rs-${i}`, text: s })));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message
        : (err as { message?: string })?.message || 'Unexpected error';
      const botMsg: ChatMessage = {
        id: uid(),
        role: 'bot',
        blocks: [{ type: 'text', content: errMsg }],
        timestamp: new Date(),
        error: true,
        retryOf: userText,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setTyping(false);
      if (!open) setHasUnread(true);
    }
  }, [activeCampaignId, conversationId, open]);

  /* ─── Retry a failed bot message ─── */
  const retryMessage = useCallback(async (errorMsgId: string, userText: string) => {
    if (typing) return;
    setMessages((prev) => prev.filter((m) => m.id !== errorMsgId));
    await callChatApi(userText);
  }, [typing, callChatApi]);

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

      /* Intercept !noti command — demo trigger, skip API */
      const parsed = parseNotiCommand(text);
      if (parsed) {
        if ('error' in parsed) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'bot',
              blocks: [{ type: 'text', content: parsed.error }],
              timestamp: new Date(),
            },
          ]);
        } else {
          pushNoti({
            severity: parsed.severity,
            content: parsed.content,
            title: parsed.title,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'bot',
              blocks: [
                {
                  type: 'text',
                  content: `Triggered ${parsed.severity} notification.`,
                },
              ],
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      /* Intercept !demo command — rich content showcase, skip API */
      const demoResult = parseDemoCommand(text);
      if (demoResult) {
        if ('error' in demoResult) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'bot',
              blocks: [{ type: 'text', content: demoResult.error }],
              timestamp: new Date(),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'bot',
              blocks: demoResult,
              timestamp: new Date(),
            },
          ]);
        }
        return;
      }

      await callChatApi(text.trim());
    },
    [typing, pushNoti, callChatApi],
  );

  /* ─── Render helpers ─── */

  const renderBlocks = (blocks: BotResponseBlock[], onAccent: boolean) =>
    blocks.map((block, i) => {
      if (block.type === 'text') {
        return (
          <ChatMarkdown key={i} onAccent={onAccent}>
            {block.content ?? ''}
          </ChatMarkdown>
        );
      }
      if (block.type === 'bullets' && block.items) {
        const md = block.items.map((item) => `- ${item}`).join('\n');
        return (
          <ChatMarkdown key={i} onAccent={onAccent}>
            {md}
          </ChatMarkdown>
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
      return;
    }
    // Recall last user message when ArrowUp pressed on empty input
    if (e.key === 'ArrowUp' && input === '') {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUser) {
        const text = blocksToPlainText(lastUser.blocks);
        if (text) {
          e.preventDefault();
          setInput(text);
          // Put caret at end after state updates
          requestAnimationFrame(() => {
            const el = inputRef.current;
            if (el) el.setSelectionRange(text.length, text.length);
          });
        }
      }
    }
  };

  /* ─── JSX ─── */

  return (
    <>
      {/* ── FAB ── */}
      <button
        onClick={toggleOpen}
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
        title="Campaign Assistant (Ctrl+K)"
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
          'fixed z-[95] flex flex-col overflow-hidden',
          'transition-all duration-300 ease-out',
          open
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none',
          isDocked
            ? 'top-0 bottom-0 right-0 w-[33vw] min-w-[420px] max-w-[600px] rounded-none'
            : 'bottom-20 right-6 w-[400px] h-[550px] rounded-2xl max-[480px]:bottom-0 max-[480px]:right-0 max-[480px]:w-full max-[480px]:h-full max-[480px]:rounded-none',
        )}
        style={{
          background: 'var(--bg-surface-solid)',
          border: '1px solid var(--border)',
          boxShadow: isDocked
            ? '-8px 0 32px rgba(0,0,0,0.12)'
            : '0 16px 48px rgba(0,0,0,0.18), 0 0 0 1px var(--border-subtle)',
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
            <div
              className="text-[11px] truncate"
              style={{ color: 'var(--text-muted)' }}
              title={campaignName ?? undefined}
            >
              {campaignName
                ? <>Scope: <span style={{ color: 'var(--accent)' }}>{campaignName}</span></>
                : 'No campaign selected'}
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={messages.length === 0}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              messages.length === 0 && 'opacity-40 cursor-not-allowed',
            )}
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              if (messages.length > 0) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Reset conversation"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMode}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label={isDocked ? 'Collapse to floating' : 'Expand to side panel'}
            title={isDocked ? 'Collapse to floating' : 'Expand to side panel'}
          >
            {isDocked ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
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
        <div className="flex-1 relative min-h-0">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-3"
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

          {messages.map((msg, idx) => {
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
            const isError = !!msg.error;
            const isLastBot = !isUser && idx === messages.length - 1;
            return (
              <div
                key={msg.id}
                className={clsx(
                  'group flex gap-2 animate-[fadeIn_300ms_ease]',
                  isUser ? 'justify-end' : 'justify-start',
                )}
              >
                {!isUser && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: isError ? 'var(--danger-bg)' : 'var(--accent-subtle)',
                      color: isError ? 'var(--danger)' : 'var(--accent)',
                    }}
                  >
                    {isError ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>
                )}
                <div className={clsx('flex flex-col max-w-[85%] min-w-0', isUser ? 'items-end' : 'items-start')}>
                  <div
                    className={clsx(
                      'rounded-2xl px-3.5 py-2.5 space-y-2',
                      isUser ? 'rounded-br-md' : 'rounded-bl-md',
                    )}
                    style={{
                      background: isUser
                        ? 'var(--accent)'
                        : isError
                          ? 'var(--danger-bg)'
                          : 'var(--bg-elevated)',
                      color: isUser ? '#fff' : 'var(--text-primary)',
                      border: isUser
                        ? 'none'
                        : isError
                          ? '1px solid var(--danger)'
                          : '1px solid var(--border-subtle)',
                    }}
                  >
                    {renderBlocks(msg.blocks, isUser)}
                    {isError && msg.retryOf && (
                      <button
                        onClick={() => retryMessage(msg.id, msg.retryOf!)}
                        disabled={typing}
                        className={clsx(
                          'mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors',
                          typing && 'opacity-50 cursor-not-allowed',
                        )}
                        style={{
                          background: 'var(--danger)',
                          color: '#fff',
                        }}
                        title="Retry this request"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry
                      </button>
                    )}
                  </div>
                  {/* Meta row: timestamp + actions (bot only) */}
                  <div
                    className={clsx(
                      'flex items-center gap-1 mt-1 px-1 text-[10px]',
                      'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                      isUser ? 'flex-row-reverse' : 'flex-row',
                    )}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span title={formatFullTime(msg.timestamp)}>
                      {formatRelativeTime(msg.timestamp)}
                    </span>
                    {!isUser && !isError && msg.blocks.length > 0 && (
                      <>
                        <span>·</span>
                        <button
                          onClick={() => copyMessage(msg)}
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors"
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                  {/* Follow-up suggestion chips */}
                  {isLastBot && msg.suggestions && msg.suggestions.length > 0 && !typing && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.suggestions.map((s, si) => (
                        <button
                          key={si}
                          onClick={() => sendMessage(s)}
                          className="text-[11.5px] px-2.5 py-1 rounded-full transition-all duration-200"
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
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isUser && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: 'var(--bg-inset)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <UserIcon className="w-3 h-3" />
                  </div>
                )}
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

        {/* Scroll-to-bottom pill */}
        {showScrollDown && (
          <button
            onClick={scrollToBottom}
            className="absolute left-1/2 -translate-x-1/2 bottom-3 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-[11.5px] font-medium shadow-lg animate-[fadeIn_200ms_ease]"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            }}
            title="Jump to latest"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            New messages
          </button>
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
              placeholder={typing ? 'Đang chờ phản hồi...' : 'Hỏi về campaign... (↑ recall, Esc close)'}
              rows={1}
              disabled={typing}
              title={typing ? 'Đang chờ phản hồi, vui lòng đợi...' : undefined}
              className="flex-1 bg-transparent resize-none text-[13px] leading-snug outline-none overflow-y-auto disabled:cursor-not-allowed"
              style={{
                color: 'var(--text-primary)',
                caretColor: 'var(--accent)',
                maxHeight: '120px',
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              title={
                typing
                  ? 'Đang chờ phản hồi...'
                  : !input.trim()
                    ? 'Nhập tin nhắn để gửi'
                    : 'Send (Enter)'
              }
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

        {/* ── Reset confirm overlay ── */}
        {showResetConfirm && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center px-6 animate-[fadeIn_180ms_ease]"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
          >
            <div
              className="w-full max-w-[320px] rounded-xl p-5"
              style={{
                background: 'var(--bg-surface-solid)',
                border: '1px solid var(--border)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
              }}
            >
              <div
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Reset conversation?
              </div>
              <div
                className="text-[12px] leading-snug mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                All messages in this conversation will be cleared. This cannot be undone.
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={resetConversation}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                  style={{ background: 'var(--danger)', color: '#fff' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
