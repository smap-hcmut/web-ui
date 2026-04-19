'use client';

import { useState, useRef, useEffect, useCallback, type DragEvent } from 'react';
import {
  Bot,
  X,
  Minus,
  Send,
  Paperclip,
  MessageSquare,
  Database,
  Download,
  Trash2,
  FileText,
  Upload,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import clsx from 'clsx';
import type { BotResponseBlock } from '@/lib/types';

/* ─── Inline assistant data (moved from mock-assistant) ─── */

const suggestedQuestions = [
  { id: 'sq1', text: 'Tóm tắt sentiment tuần này', icon: 'bar-chart' },
  { id: 'sq2', text: 'Top 5 bài viết có engagement cao nhất', icon: 'trending-up' },
  { id: 'sq3', text: 'So sánh hiệu suất giữa các platform', icon: 'git-compare' },
  { id: 'sq4', text: 'Xu hướng keyword nổi bật', icon: 'hash' },
];

const fallbackResponse: BotResponseBlock[] = [
  { type: 'text', content: 'Cảm ơn bạn! Tôi đã ghi nhận câu hỏi. Hiện tại tính năng AI Assistant đang được phát triển. Vui lòng thử lại sau.' },
];

function findBotResponse(userMessage: string): BotResponseBlock[] {
  // TODO: Replace with real knowledge-srv API call
  void userMessage;
  return fallbackResponse;
}

function generateCSVTemplate(): string {
  const headers = ['platform', 'post_url', 'author', 'content', 'timestamp', 'likes', 'comments', 'shares', 'sentiment'];
  const rows = [
    ['tiktok', 'https://tiktok.com/@user/video/123', '@creator_vn', 'Review sản phẩm mới', '2026-04-10T14:30:00Z', '12500', '340', '890', 'positive'],
    ['facebook', 'https://facebook.com/post/456', 'Nguyễn Văn A', 'Thử và thấy khá ổn', '2026-04-11T09:15:00Z', '450', '67', '23', 'neutral'],
  ];
  return [headers.join(','), ...rows.map(r => r.map(c => c.includes(',') ? `"${c}"` : c).join(','))].join('\n');
}

/* ─── Types ─── */

type MessageRole = 'user' | 'bot' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  blocks: BotResponseBlock[];
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  rows: number;
  skipped: number;
  timestamp: Date;
}

/* ─── Helpers ─── */

let _msgId = 0;
const uid = () => `msg-${++_msgId}-${Date.now()}`;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Component ─── */

export function CampaignAssistant() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'sources'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* auto-scroll on new message */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  /* focus input when panel opens */
  useEffect(() => {
    if (open && tab === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, tab]);

  /* clear unread on open */
  useEffect(() => {
    if (open) setHasUnread(false);
  }, [open]);

  /* ─── Send message ─── */
  const sendMessage = useCallback(
    (text: string) => {
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

      /* simulate bot reply after delay */
      const delay = 1200 + Math.random() * 800;
      setTimeout(() => {
        const responseBlocks = findBotResponse(text);
        const botMsg: ChatMessage = {
          id: uid(),
          role: 'bot',
          blocks: responseBlocks,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setTyping(false);
        if (!open) setHasUnread(true);
      }, delay);
    },
    [typing, open],
  );

  /* ─── File upload simulation ─── */
  const handleFileUpload = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') return;

    setUploading(true);
    setUploadProgress(0);

    /* simulate progress */
    const steps = [10, 30, 55, 75, 90, 100];
    steps.forEach((pct, i) => {
      setTimeout(() => {
        setUploadProgress(pct);
        if (pct === 100) {
          const totalRows = 8 + Math.floor(Math.random() * 40);
          const skipped = Math.floor(Math.random() * 4);
          const uploaded: UploadedFile = {
            id: `file-${Date.now()}`,
            name: file.name,
            size: file.size,
            rows: totalRows - skipped,
            skipped,
            timestamp: new Date(),
          };
          setFiles((prev) => [uploaded, ...prev]);
          setUploading(false);
          setUploadProgress(0);

          /* add system message in chat */
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'system',
              blocks: [
                {
                  type: 'text',
                  content: `File "${file.name}" uploaded — ${uploaded.rows} rows imported${skipped > 0 ? `, ${skipped} rows skipped (missing data)` : ''}.`,
                },
              ],
              timestamp: new Date(),
            },
          ]);
        }
      }, 400 * (i + 1));
    });
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const downloadTemplate = useCallback(() => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smap-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

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

        {/* ── Tab bar ── */}
        <div
          className="flex shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {(['chat', 'sources'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
              )}
              style={{
                color:
                  tab === t ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom:
                  tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                background: tab === t ? 'var(--accent-subtle)' : 'transparent',
              }}
            >
              {t === 'chat' ? (
                <MessageSquare className="w-3.5 h-3.5" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              {t === 'chat' ? 'Chat' : 'Data Sources'}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {tab === 'chat' ? (
          <>
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
                    {suggestedQuestions.map((q) => (
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
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded-lg transition-colors shrink-0 mb-0.5"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
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

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                handleFileUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </>
        ) : (
          /* ── Data Sources tab ── */
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Download template */}
            <button
              onClick={downloadTemplate}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200"
              style={{
                background: 'var(--accent-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <Download className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <div className="text-sm font-semibold">Download Template</div>
                <div
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  CSV template with sample data
                </div>
              </div>
            </button>

            {/* Upload zone */}
            <div
              className={clsx(
                'rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
                dragOver && 'scale-[1.02]',
              )}
              style={{
                borderColor: dragOver ? 'var(--accent)' : 'var(--border)',
                background: dragOver
                  ? 'var(--accent-subtle)'
                  : 'var(--bg-inset)',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2 py-8">
                <Upload
                  className="w-8 h-8"
                  style={{
                    color: dragOver ? 'var(--accent)' : 'var(--text-faint)',
                  }}
                />
                <p
                  className="text-sm font-medium"
                  style={{
                    color: dragOver
                      ? 'var(--accent)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {dragOver ? 'Drop file here' : 'Drag & drop or click to browse'}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-faint)' }}
                >
                  Accepted: .csv, .xlsx
                </p>
              </div>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-2 animate-[fadeIn_200ms_ease]">
                <div className="flex items-center justify-between text-[11px]">
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Uploading...
                  </span>
                  <span style={{ color: 'var(--accent)' }}>
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-inset)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-faint)' }}
                >
                  Uploaded Files
                </h4>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 animate-[fadeIn_300ms_ease]"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <FileText
                      className="w-5 h-5 shrink-0"
                      style={{ color: 'var(--accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[13px] font-medium truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {file.name}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {formatFileSize(file.size)} · {file.rows} rows
                        {file.skipped > 0 && ` · ${file.skipped} skipped`}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="p-1 rounded-lg transition-colors shrink-0"
                      style={{ color: 'var(--text-faint)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--danger)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-faint)';
                      }}
                      aria-label="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length === 0 && !uploading && (
              <p
                className="text-center text-[12px] py-4"
                style={{ color: 'var(--text-faint)' }}
              >
                No files uploaded yet
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
