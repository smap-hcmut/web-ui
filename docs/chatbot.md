# Campaign Assistant (Chatbot)

Floating AI chat panel on `/smap` pages. Wired to `knowledge-srv` via [src/lib/api/knowledge.ts](../src/lib/api/knowledge.ts).

## UI modes

| Mode       | Trigger                         | Size                          |
| ---------- | ------------------------------- | ----------------------------- |
| Collapsed  | default                         | FAB bottom-right              |
| Floating   | click FAB                       | 400×550 bottom-right          |
| Docked     | click Maximize in header        | `clamp(420px, 33vw, 600px)` full-height right side; pushes `TopNav`, `main`, and `LiveTicker` |

Mode + open state persist to `localStorage` under `smap:assistant:mode` and `smap:assistant:open`.

## Header buttons

- **Reset** (↺) — prompts a confirm overlay, then clears the current conversation (messages + `conversation_id`). Disabled when there are no messages. Nothing is backed up.
- **Expand/Collapse** (⬈/⬋) — toggle floating ↔ docked.
- **Close** (×) — close the panel (state still persisted, reopen restores it).

The subtitle shows the active campaign name (pulled from `useCampaigns()` by `camp_id`). Falls back to `No campaign selected` when outside a campaign scope.

## Keyboard shortcuts

| Keys            | Action                                        |
| --------------- | --------------------------------------------- |
| `Ctrl/Cmd + K`  | Toggle the panel (ignored inside input fields) |
| `Esc`           | Close panel (or dismiss the reset overlay if open) |
| `Enter`         | Send message                                  |
| `Shift + Enter` | Insert newline                                |
| `↑` (empty input) | Recall last user message                    |

## Message interactions

Hovering over any message reveals a meta row (timestamp + actions):

- **Timestamp** — shown as relative ("2m ago"); hover for absolute time.
- **Copy** (bot messages only) — copies the rendered content as plain text (blocks → text, bullets → `- item` lines, stats → `label: value (+X%)`).
- **Retry** (error bubbles only) — re-sends the same user prompt and replaces the error with the new response. The error bubble is removed when retry starts.

## Error handling

Failed bot responses render in a distinct error bubble: danger color scheme, warning icon, and a Retry button that re-invokes the API with the original user prompt.

## Follow-up suggestions

When `knowledge-srv` returns `suggestions[]` in the chat response, they attach to that specific bot message. The chips render below the last bot bubble only (not historical ones) and disappear once a new message is sent or the response is superseded.

The empty-state screen also shows suggestions, seeded from `knowledgeApi.suggestions(campaignId)` on campaign change.

## Smart scrolling

The message list auto-scrolls to the bottom only when the user is already within 80px of it. If the user has scrolled up to read history and a new message arrives, a floating **"New messages ↓"** pill appears; clicking it smooth-scrolls to the latest. Scrolling back to the bottom manually also clears the pill.

## Chat persistence

Chat history is saved to `localStorage` per campaign under `smap:assistant:chat:<campaignId>`.

- **TTL**: 4 hours since last message. Older sessions are auto-cleared on next load.
- **Cap**: 100 most recent messages.
- **Scope**: switching the active campaign (`camp_id` URL param) loads that campaign's chat; the previous campaign's chat remains saved.
- **Reset**: the Reset button wipes the persisted entry for the current campaign too.

F5 / full page reloads restore the panel open state, mode, messages, and `conversation_id` so multi-turn context is preserved across refreshes.

## Rich content — Markdown

Bot text messages are rendered by [ChatMarkdown.tsx](../src/components/ChatMarkdown.tsx) (powered by `react-markdown` + `remark-gfm`).

Backend can return markdown in the `answer` field and it renders natively. Supported syntax:

| Feature          | Syntax                                |
| ---------------- | ------------------------------------- |
| Bold             | `**text**`                            |
| Italic           | `*text*` or `_text_`                  |
| Strikethrough    | `~~text~~`                            |
| Inline code      | `` `code` ``                          |
| Code block       | ` ```lang\n...\n``` `                 |
| Link             | `[label](https://…)`                  |
| Unordered list   | `- item`                              |
| Ordered list     | `1. item`                             |
| Task list        | `- [x] done` / `- [ ] todo`           |
| Table            | GFM pipe table                        |
| Blockquote       | `> text`                              |
| Heading          | `# H1` … `#### H4`                    |
| Horizontal rule  | `---`                                 |
| Highlight        | `<mark>text</mark>` (HTML passthrough via block) |

HTML is **not** enabled by default (no `rehype-raw`) — `<mark>` works because we define a component override for it in the renderer, not arbitrary HTML. This keeps XSS surface small.

### Example backend response

```json
{
  "answer": "### Top posts this week\n\n| Platform | Author | Engagement |\n|---|---|---|\n| TikTok | @nguyenvana | 12.5k |\n| FB | Trang A | 8.2k |\n\n**Key insight**: Engagement trên TikTok đang vượt FB ~52%.\n\n> Đề xuất: tăng ngân sách TikTok 20% trong tuần tới."
}
```

Renders as a heading, a table, bold key insight, and a blockquote call-out.

### Block types (beyond markdown)

`BotResponseBlock` also supports structured blocks (see [src/lib/types](../src/lib/types/index.ts)):

- `text` — markdown string
- `bullets` — list of items (each item also rendered as markdown)
- `stats` — grid of KPI cards with label / value / change %

Future candidates (not yet wired): `chart` (re-use `ChartBuilder`), `callout`, `actions` (quick-reply chips).

## Chatbot slash commands (client-side)

Commands starting with `!` are intercepted locally — nothing is sent to the API.

### `!noti` — trigger a notification

```
!noti <severity> [content]
!noti <severity> "<title>" [content]
```

Full reference in [notifications.md](./notifications.md).

### `!demo` — preview rich content rendering

```
!demo                 # alias for !demo markdown
!demo markdown        # headings, table, bold/italic/strike, task list, code, blockquote, mark, hr
!demo stats           # stats KPI grid block
!demo bullets         # bullet block with inline markdown
!demo all             # stats + bullets + markdown, chained
```

Useful for verifying styles across themes without touching backend.

## Adding new client-side commands

Commands live inside [CampaignAssistant.tsx](../src/components/CampaignAssistant.tsx) at the top of `sendMessage`. Current parser is ad-hoc per command; if the list grows, consider factoring into a dispatch table like:

```ts
const commandHandlers: Record<string, (args: string) => void> = {
  '!noti': handleNoti,
  '!clear': () => setShowResetConfirm(true),
  // …
};
```

## Textarea auto-grow

Input textarea grows from 1 line up to ~5 lines (120px cap), then scrolls. Implemented by resizing on `input` change in a `useEffect`. Enter sends; Shift+Enter inserts a newline.
