"use client";

import { useEffect, useRef } from "react";

import { useNotificationStore, type NotificationCategory } from "@/lib/stores/notifications";

type NotificationEnvelope = {
  type?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
  message?: string;
};

type NotificationKind = "info" | "success" | "warning" | "critical";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 15_000;

export function NotificationSocket() {
  const push = useNotificationStore((state) => state.push);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const connect = () => {
      if (stoppedRef.current) {
        return;
      }

      const url = buildNotificationWsUrl();
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
      };

      socket.onmessage = (event) => {
        const notification = parseNotification(event.data);
        if (!notification) {
          return;
        }
        push(notification as never);
      };

      socket.onclose = () => {
        socketRef.current = null;
        scheduleReconnect(connect);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    const scheduleReconnect = (callback: () => void) => {
      if (stoppedRef.current || reconnectTimerRef.current !== null) {
        return;
      }

      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** Math.min(attempt - 1, 4), RECONNECT_MAX_MS);

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        callback();
      }, delay);
    };

    connect();

    return () => {
      stoppedRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [push]);

  return null;
}

function buildNotificationWsUrl() {
  const configured = process.env.NEXT_PUBLIC_NOTIFICATION_WS_URL;
  if (configured) {
    return configured;
  }

  const endpoint = "/notification/ws";
  const currentHost = window.location.host;
  const apiBase =
    currentHost === "smap.tantai.dev" || currentHost.endsWith(".tantai.dev")
      ? "https://smap-api.tantai.dev"
      : `${window.location.protocol}//${currentHost}`;

  const url = new URL(endpoint, apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

function parseNotification(rawData: string) {
  let envelope: NotificationEnvelope;
  try {
    envelope = JSON.parse(rawData) as NotificationEnvelope;
  } catch {
    return null;
  }

  const payload = envelope.payload ?? {};
  const timestamp = envelope.timestamp ?? new Date().toISOString();
  const mapped = mapEnvelope(envelope.type ?? "SYSTEM", payload);

  const isCrisis = mapped.category === "crisis";

  return {
    id: crypto.randomUUID(),
    title: mapped.title,
    message: mapped.message,
    description: mapped.message,
    content: mapped.message,
    type: mapped.kind,
    severity: mapped.kind,
    category: mapped.category,
    source: "websocket",
    timestamp,
    createdAt: timestamp,
    read: false,
    showToast: isCrisis,
    showBanner: isCrisis && mapped.kind === "critical",
    payload,
  };
}

function mapEnvelope(
  type: string,
  payload: Record<string, unknown>,
): { title: string; message: string; kind: NotificationKind; category: NotificationCategory } {
  if (type === "ANALYTICS_PIPELINE") {
    const projectId = stringValue(payload.project_id);
    const sourceId = stringValue(payload.source_id);
    const totalRecords = numberValue(payload.total_records);
    const phase = stringValue(payload.current_phase) || "updated";
    const sourceText = sourceId ? ` from ${sourceId}` : "";
    const recordText = totalRecords > 0 ? `${totalRecords} records` : "new data";

    return {
      title: "Analysis updated",
      message: `Digest ${phase}${sourceText}: ${recordText} processed for project ${projectId || "current project"}.`,
      kind: "success",
      category: "analysis",
    };
  }

  if (type === "CRISIS_ALERT") {
    const severity = stringValue(payload.severity).toLowerCase();
    return {
      title: stringValue(payload.title) || "Crisis alert",
      message:
        stringValue(payload.message) ||
        `${stringValue(payload.project_name) || "A project"} reached a crisis response threshold.`,
      kind: severity === "critical" || severity === "high" ? "critical" : "warning",
      category: "crisis",
    };
  }

  if (type === "CAMPAIGN_EVENT") {
    return {
      title: stringValue(payload.title) || "Campaign update",
      message: stringValue(payload.message) || "Campaign state changed.",
      kind: "info",
      category: "campaign",
    };
  }

  if (type === "DATA_ONBOARDING") {
    return {
      title: stringValue(payload.title) || "Data onboarding update",
      message: stringValue(payload.message) || "A datasource onboarding event was received.",
      kind: "info",
      category: "data",
    };
  }

  return {
    title: stringValue(payload.title) || "System notification",
    message: stringValue(payload.message) || "A new system event was received.",
    kind: "info",
    category: "system",
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : 0;
}
