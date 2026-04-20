# Notifications

4-level notification system for SMAP with toast, bell drawer, and critical banner surfaces. State lives in a zustand store persisted to `localStorage`.

## Severity levels

| Severity   | Color     | Auto-dismiss toast | Banner |
| ---------- | --------- | ------------------ | ------ |
| `info`     | blue      | 5s                 | no     |
| `success`  | green     | 5s                 | no     |
| `warning`  | amber     | 10s                | no     |
| `critical` | red       | never (sticky)     | yes    |

All levels appear in the bell drawer with unread badge.

## Triggering from code

```ts
import { useNotificationStore } from '@/lib/stores';

// Inside a component
const push = useNotificationStore((s) => s.push);

push({
  severity: 'warning',
  title: 'Engagement drop',             // optional
  content: 'Down 15% in the last hour',
});
```

Outside React, use `getState`:

```ts
import { useNotificationStore } from '@/lib/stores';

useNotificationStore.getState().push({
  severity: 'critical',
  content: 'Sentiment spike detected',
});
```

## Store API

```ts
type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

interface Notification {
  id: string;
  severity: NotificationSeverity;
  content: string;
  title?: string;
  timestamp: number;
  read: boolean;
  toastDismissed: boolean;
  bannerDismissed: boolean;
}

// Actions
push({ severity, content, title? }): Notification
dismissToast(id)      // hide from toast stack, keep in drawer
dismissBanner(id)     // critical-only, close top banner
markRead(id)
markAllRead()
remove(id)            // delete from drawer
clear()               // wipe all
```

Store persists the last 50 notifications under `smap:notifications` in `localStorage`.

## Surfaces

- **Toast stack** — bottom-right, max 5 visible. Shifts left when the Campaign Assistant is docked.
- **Bell** — in `TopNav`, with unread badge. Click to open drawer (mark read, mark all, remove, clear).
- **Banner** — top of page, only when an undismissed `critical` exists.

All surfaces are mounted once in [src/app/smap/layout.tsx](../src/app/smap/layout.tsx).

## Demo via chatbot

The Campaign Assistant intercepts `!noti` commands locally — nothing is sent to the API.

```
!noti <severity> [content]
!noti <severity> "<title>" [content]
```

Severities: `info`, `success`, `warning`, `critical`.
Aliases: `ok` → success, `warn` → warning, `error`/`crit` → critical.

### Examples

```
!noti info Stalker phát hiện 3 post mới
!noti success Campaign launch đạt 10k impression
!noti warning Engagement giảm 15% trong 1h qua
!noti critical Sentiment spike âm vượt ngưỡng 30%
!noti warning "Spike detected" Sentiment âm tăng 20% trên TikTok
```

Malformed commands (unknown severity, missing content) are reported back by the bot in-chat without creating a notification.
