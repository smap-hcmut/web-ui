import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface Notification {
  id: string;
  severity: NotificationSeverity;
  content: string;
  title?: string;
  timestamp: number;
  read: boolean;
  toastDismissed: boolean;
  bannerDismissed: boolean;
}

interface PushInput {
  severity: NotificationSeverity;
  content: string;
  title?: string;
}

interface NotificationState {
  notifications: Notification[];
  push: (input: PushInput) => Notification;
  dismissToast: (id: string) => void;
  dismissBanner: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
}

const MAX_STORED = 50;

let _idCounter = 0;
const genId = () => `noti-${Date.now()}-${++_idCounter}`;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      push: ({ severity, content, title }) => {
        const n: Notification = {
          id: genId(),
          severity,
          content,
          title,
          timestamp: Date.now(),
          read: false,
          toastDismissed: false,
          bannerDismissed: false,
        };
        set((s) => ({
          notifications: [n, ...s.notifications].slice(0, MAX_STORED),
        }));
        return n;
      },

      dismissToast: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, toastDismissed: true } : n,
          ),
        })),

      dismissBanner: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, bannerDismissed: true } : n,
          ),
        })),

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      remove: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      clear: () => set({ notifications: [] }),
    }),
    {
      name: 'smap:notifications',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export const AUTO_DISMISS_MS: Record<NotificationSeverity, number | null> = {
  info: 5000,
  success: 5000,
  warning: 10000,
  critical: null,
};
