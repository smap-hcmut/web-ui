'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  children: string;
  /** If true, use inverted colors for user messages (on accent bg) */
  onAccent?: boolean;
}

export function ChatMarkdown({ children, onAccent = false }: Props) {
  const linkColor = onAccent ? '#fff' : 'var(--accent)';
  const codeBg = onAccent ? 'rgba(255,255,255,0.18)' : 'var(--bg-inset)';
  const codeBorder = onAccent ? 'rgba(255,255,255,0.25)' : 'var(--border-subtle)';
  const tableBorder = onAccent ? 'rgba(255,255,255,0.25)' : 'var(--border)';
  const quoteBorder = onAccent ? 'rgba(255,255,255,0.35)' : 'var(--accent)';
  const markBg = onAccent ? 'rgba(255,255,255,0.22)' : 'var(--warning-bg)';
  const markColor = onAccent ? '#fff' : 'var(--warning)';

  return (
    <div className="chat-md text-[13px] leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through opacity-70">{children}</del>,
          u: ({ children }) => <u>{children}</u>,
          mark: ({ children }) => (
            <mark
              className="px-1 rounded"
              style={{ background: markBg, color: markColor }}
            >
              {children}
            </mark>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
              style={{ color: linkColor }}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 my-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 my-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-[15px] font-semibold mt-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[14px] font-semibold mt-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold mt-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[13px] font-semibold mt-1">{children}</h4>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="pl-3 py-0.5 my-1 text-[12.5px]"
              style={{
                borderLeft: `3px solid ${quoteBorder}`,
                opacity: 0.9,
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !/language-/.test(className ?? '');
            if (isInline) {
              return (
                <code
                  className="px-1 py-0.5 rounded text-[12px] font-mono"
                  style={{
                    background: codeBg,
                    border: `1px solid ${codeBorder}`,
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block px-2.5 py-2 rounded-md text-[12px] font-mono overflow-x-auto"
                style={{
                  background: codeBg,
                  border: `1px solid ${codeBorder}`,
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-1 not-prose">{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-1">
              <table
                className="text-[12px] w-full"
                style={{ borderCollapse: 'collapse' }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ borderBottom: `1px solid ${tableBorder}` }}>
              {children}
            </thead>
          ),
          th: ({ children, style }) => (
            <th
              className="px-2 py-1 text-left font-semibold"
              style={{ ...style, borderBottom: `1px solid ${tableBorder}` }}
            >
              {children}
            </th>
          ),
          td: ({ children, style }) => (
            <td
              className="px-2 py-1"
              style={{ ...style, borderBottom: `1px solid ${tableBorder}` }}
            >
              {children}
            </td>
          ),
          hr: () => (
            <hr
              className="my-2"
              style={{ borderColor: tableBorder }}
            />
          ),
          input: ({ type, checked, disabled }) => {
            // GFM task-list checkbox
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  readOnly
                  className="mr-1 align-middle"
                />
              );
            }
            return null;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
