"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BellRing,
  Flame,
  Info,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  projectApi,
  type CrisisConfig,
  type CrisisConfigInput,
  type CrisisKeywordGroupInput,
} from "@/lib/api/projects";
import {
  buildCrisisConfigPreset,
  buildDefaultCrisisConfig,
  buildDefaultResponsePolicy,
} from "@/lib/crisis/presets";

type VolumeRule = NonNullable<
  CrisisConfigInput["volume_trigger"]
>["rules"][number];
type SentimentRule = NonNullable<
  CrisisConfigInput["sentiment_trigger"]
>["rules"][number];
type InfluencerRule = NonNullable<
  CrisisConfigInput["influencer_trigger"]
>["rules"][number];
type Status = NonNullable<CrisisConfigInput["status"]>;
type RuntimeWiring = "active" | "partial" | "reserved";

type KeywordGroupDraft = Omit<CrisisKeywordGroupInput, "keywords"> & {
  keywordsText: string;
};

type SentimentRuleDraft = Omit<SentimentRule, "critical_aspects"> & {
  criticalAspectsText?: string;
};

type EditorState = {
  status: Status;
  keywordEnabled: boolean;
  keywordLogic: "AND" | "OR";
  keywordGroups: KeywordGroupDraft[];
  volumeEnabled: boolean;
  volumeMetric: "MENTIONS" | "ENGAGEMENT" | "REACH";
  volumeRules: VolumeRule[];
  sentimentEnabled: boolean;
  sentimentMinSampleSize: number;
  sentimentRules: SentimentRuleDraft[];
  influencerEnabled: boolean;
  influencerLogic: "AND" | "OR";
  influencerRules: InfluencerRule[];
  adaptiveCrawlEnabled: boolean;
  adaptiveTriggerLevel: "WATCH" | "WARNING" | "CRITICAL";
  adaptiveCooldownMinutes: number;
  notificationEnabled: boolean;
  notificationTriggerLevel: "WARNING" | "CRITICAL";
  notificationCooldownMinutes: number;
  opsAlertOnCritical: boolean;
};

type RuntimeSignalRoute = {
  signal: string;
  configField: string;
  evidence: string;
  wiring: RuntimeWiring;
};

type Props = {
  projectId: string;
  projectName?: string;
  domainTypeCode?: string;
  compact?: boolean;
};

const inputClass =
  "w-full min-h-[44px] rounded-lg px-3 py-2.5 text-[13px] outline-none transition-all duration-200";
const textareaClass = `${inputClass} resize-y`;
const cardStyle = {
  background: "var(--bg-hover)",
  border: "1px solid var(--border)",
};
const inputStyle = {
  background: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--text-primary)",
};

const issueKeywordGroupOptions = [
  {
    value: "Service failure",
    label: "Service failure",
    description: "Service outage, delivery failure, broken journey",
    defaultWeight: 10,
  },
  {
    value: "Payment and COD",
    label: "Payment and COD",
    description: "COD, refund, overcharge, payment trust",
    defaultWeight: 8,
  },
  {
    value: "Trust and safety",
    label: "Trust and safety",
    description: "Fraud, unsafe behavior, complaint escalation",
    defaultWeight: 9,
  },
  {
    value: "Operations and coverage",
    label: "Operations and coverage",
    description: "Delay, surcharge, coverage gap, driver supply",
    defaultWeight: 7,
  },
  {
    value: "Customer support",
    label: "Customer support",
    description: "Slow support, unresolved ticket, bad experience",
    defaultWeight: 6,
  },
  {
    value: "Pricing and fees",
    label: "Pricing and fees",
    description: "Price increase, hidden fee, expensive service",
    defaultWeight: 6,
  },
  {
    value: "Brand reputation",
    label: "Brand reputation",
    description: "Boycott, bad press, viral negative claim",
    defaultWeight: 8,
  },
  {
    value: "Competitor comparison",
    label: "Competitor comparison",
    description: "Switching intent, cheaper competitor, feature gap",
    defaultWeight: 5,
  },
] as const;

const issueWeightOptions = [
  { value: 3, label: "Low signal" },
  { value: 5, label: "Monitor" },
  { value: 7, label: "High priority" },
  { value: 8, label: "Warning" },
  { value: 9, label: "Severe" },
  { value: 10, label: "Critical" },
] as const;

const runtimeSignalRoutes: RuntimeSignalRoute[] = [
  {
    signal: "Issue pressure",
    configField: "Conversation spike growth",
    evidence: "top_issues_report",
    wiring: "partial",
  },
  {
    signal: "Controversy spike",
    configField: "Viral negative comments",
    evidence: "thread_controversy_report",
    wiring: "partial",
  },
  {
    signal: "Sentiment collapse",
    configField: "Negative spike",
    evidence: "SOV entity delta",
    wiring: "partial",
  },
  {
    signal: "Response actions",
    configField: "Adaptive crawl and notification",
    evidence: "runtime policy",
    wiring: "active",
  },
];

export function CrisisConfigEditor({
  projectId,
  projectName,
  domainTypeCode,
  compact = false,
}: Props) {
  const [state, setState] = useState<EditorState>(() =>
    normalizeConfig(buildDefaultCrisisConfig()),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const domainPreset = useMemo(
    () => buildCrisisConfigPreset(domainTypeCode),
    [domainTypeCode],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessage(null);

    projectApi
      .getCrisisConfig(projectId)
      .then((config) => {
        if (cancelled) return;
        setState(normalizeConfig(config));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState(normalizeConfig(domainPreset ?? buildDefaultCrisisConfig()));
        const status =
          err && typeof err === "object" && "status" in err
            ? (err as { status?: number }).status
            : undefined;
        if (status === 404) {
          setMessage({
            type: "warning",
            text: "No saved crisis config yet. A safe editable draft is loaded.",
          });
        } else {
          setMessage({
            type: "error",
            text: "Could not load crisis config. A safe editable draft is loaded.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [domainPreset, projectId]);

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await projectApi.upsertCrisisConfig(projectId, buildPayload(state));
      setMessage({
        type: "success",
        text: "Brand risk config saved. Runtime-active rules will affect future analysis; reserved fields remain stored for classification and future scoring.",
      });
    } catch (err: unknown) {
      const text =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to save crisis config.";
      setMessage({ type: "error", text });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (config: CrisisConfigInput, label: string) => {
    setState(normalizeConfig(config));
    setMessage({
      type: "warning",
      text: `${label} loaded as draft. Click Save to apply it.`,
    });
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-4 w-4"
              style={{ color: "var(--warning)" }}
            />
            <h2
              className="text-[15px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Brand Risk Monitoring
            </h2>
          </div>
          <p
            className="mt-1 text-[12px]"
            style={{ color: "var(--text-muted)" }}
          >
            Configure brand risk monitoring for {projectName || "this project"}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={state.status}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                status: e.target.value as Status,
              }))
            }
            className="min-h-[44px] rounded-lg px-3 py-2 text-[13px] font-semibold outline-none"
            style={inputStyle}
          >
            <option value="NORMAL">NORMAL</option>
            <option value="WATCH">WATCH</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          {domainPreset && (
            <button
              type="button"
              onClick={() =>
                applyPreset(domainPreset, `${domainTypeCode} preset`)
              }
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold"
              style={{
                background: "var(--accent-subtle)",
                color: "var(--accent)",
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Load domain preset
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              applyPreset(buildDefaultCrisisConfig(), "Default preset")
            }
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold"
            style={{
              background: "var(--bg-hover)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Default
          </button>
        </div>
      </div>

      {message && (
        <div
          className="rounded-lg px-4 py-3 text-[13px]"
          style={{
            background:
              message.type === "success"
                ? "var(--success-bg)"
                : message.type === "error"
                  ? "var(--danger-bg)"
                  : "var(--warning-bg)",
            color:
              message.type === "success"
                ? "var(--success)"
                : message.type === "error"
                  ? "var(--danger)"
                  : "var(--warning)",
          }}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div
          className="rounded-lg px-5 py-8 text-center text-[13px]"
          style={cardStyle}
        >
          Loading crisis config...
        </div>
      ) : (
        <>
          <RuntimeMappingPanel />
          <KeywordSection state={state} setState={setState} />
          <VolumeSection state={state} setState={setState} />
          <SentimentSection state={state} setState={setState} />
          <InfluencerSection state={state} setState={setState} />
          <ResponsePolicySection state={state} setState={setState} />

          <div className="sticky bottom-0 flex justify-end pt-2">
            <button
              type="button"
              onClick={saveConfig}
              disabled={saving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save crisis config"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function CrisisConfigEditorModal({
  projectId,
  projectName,
  domainTypeCode,
  onClose,
}: Props & { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 top-[88px] z-[120] flex items-start justify-center overflow-y-auto px-4 pb-6 pt-4 sm:pt-5"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-124px)] w-full max-w-5xl overflow-y-auto rounded-lg p-5 sm:p-6"
        style={{
          background: "var(--bg-surface-solid)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3
              className="text-[15px] font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Project crisis config
            </h3>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {projectName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg"
            style={{
              background: "var(--bg-hover)",
              color: "var(--text-muted)",
            }}
            aria-label="Close crisis config"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CrisisConfigEditor
          projectId={projectId}
          projectName={projectName}
          domainTypeCode={domainTypeCode}
          compact
        />
      </div>
    </div>,
    document.body,
  );
}

function SectionHeader({
  icon,
  title,
  wiring,
  description,
  enabled,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  wiring: RuntimeWiring;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </span>
          <RuntimeBadge wiring={wiring} />
        </div>
        <SwitchControl checked={enabled} onChange={onToggle} label="Enabled" />
      </div>
      <p
        className="mt-1 pl-7 text-[11px] leading-5"
        style={{ color: "var(--text-muted)" }}
      >
        {description}
      </p>
    </div>
  );
}

function RuntimeBadge({ wiring }: { wiring: RuntimeWiring }) {
  const copy = {
    active: {
      label: "Runtime active",
      bg: "var(--success-bg)",
      color: "var(--success)",
    },
    partial: {
      label: "Partly active",
      bg: "var(--warning-bg)",
      color: "var(--warning)",
    },
    reserved: {
      label: "Reserved",
      bg: "var(--bg-surface)",
      color: "var(--text-muted)",
    },
  }[wiring];

  return (
    <span
      className="rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase"
      style={{
        background: copy.bg,
        color: copy.color,
        border: "1px solid var(--border)",
      }}
    >
      {copy.label}
    </span>
  );
}

function SwitchControl({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2.5 text-[12px] font-semibold"
      style={{
        background: checked ? "var(--accent-subtle)" : "var(--bg-surface)",
        color: checked ? "var(--accent)" : "var(--text-muted)",
        border: "1px solid var(--border)",
      }}
    >
      <span
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--border)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
          style={{
            left: 2,
            background: "var(--bg-surface-solid)",
            transform: checked ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </span>
      {label}
    </button>
  );
}

function RuntimeNote({
  wiring,
  children,
}: {
  wiring: RuntimeWiring;
  children: ReactNode;
}) {
  return (
    <div
      className="flex gap-2 rounded-lg px-3 py-2 text-[12px] leading-5"
      style={{
        background: "var(--bg-surface)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <Info
        className="mt-0.5 h-3.5 w-3.5 shrink-0"
        style={{
          color:
            wiring === "reserved"
              ? "var(--text-muted)"
              : wiring === "partial"
                ? "var(--warning)"
                : "var(--success)",
        }}
      />
      <div>{children}</div>
    </div>
  );
}

function RuntimeMappingPanel() {
  return (
    <section
      className="rounded-lg p-4"
      style={{ ...cardStyle, background: "var(--bg-surface)" }}
    >
      <div className="mb-3 flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4" style={{ color: "var(--accent)" }} />
        <div>
          <h3
            className="text-[13px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Runtime mapping
          </h3>
          <p
            className="mt-1 text-[11px] leading-5"
            style={{ color: "var(--text-muted)" }}
          >
            Current crisis detection uses three BI-backed signals. Other fields
            are saved for issue classification, presets, and future scorer
            expansion.
          </p>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {runtimeSignalRoutes.map((route) => (
          <div
            key={route.signal}
            className="rounded-lg p-3"
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className="text-[12px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {route.signal}
              </div>
              <RuntimeBadge wiring={route.wiring} />
            </div>
            <div
              className="mt-1 text-[11px]"
              style={{ color: "var(--text-secondary)" }}
            >
              {route.configField}
            </div>
            <div
              className="mt-1 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              {route.evidence}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function KeywordSection({
  state,
  setState,
}: {
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
}) {
  const updateGroup = (idx: number, patch: Partial<KeywordGroupDraft>) => {
    setState((prev) => ({
      ...prev,
      keywordGroups: prev.keywordGroups.map((group, groupIdx) =>
        groupIdx === idx ? { ...group, ...patch } : group,
      ),
    }));
  };
  const addGroup = () => {
    setState((prev) => {
      const used = new Set(prev.keywordGroups.map((group) => group.name));
      const next =
        issueKeywordGroupOptions.find((option) => !used.has(option.value)) ??
        issueKeywordGroupOptions[0];
      return {
        ...prev,
        keywordGroups: [
          ...prev.keywordGroups,
          { name: next.value, keywordsText: "", weight: next.defaultWeight },
        ],
      };
    });
  };

  return (
    <section className="rounded-lg p-4" style={cardStyle}>
      <SectionHeader
        icon={
          <BellRing className="h-4 w-4" style={{ color: "var(--accent)" }} />
        }
        title="Issue Keywords"
        wiring="reserved"
        description="Saved as marketing issue taxonomy. Current CRISIS_ALERT scoring does not directly match these keywords yet."
        enabled={state.keywordEnabled}
        onToggle={(value) =>
          setState((prev) => ({ ...prev, keywordEnabled: value }))
        }
      />
      {state.keywordEnabled && (
        <div className="space-y-3">
          <RuntimeNote wiring="reserved">
            Use these groups to keep crisis presets and issue language
            business-readable. They are not the direct reason a crisis alert
            fires in the current runtime.
          </RuntimeNote>
          <div className="max-w-xs">
            <label
              className="mb-1 block text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Matching logic
            </label>
            <select
              value={state.keywordLogic}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  keywordLogic: e.target.value as "AND" | "OR",
                }))
              }
              className={inputClass}
              style={inputStyle}
            >
              <option value="OR">OR - any group can trigger</option>
              <option value="AND">AND - all groups required</option>
            </select>
          </div>
          {state.keywordGroups.map((group, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-lg p-3 md:grid-cols-[220px_150px_2fr_auto]"
              style={{ background: "var(--bg-surface)" }}
            >
              <label className="block">
                <span
                  className="mb-1 block text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Risk theme
                </span>
                <select
                  value={group.name}
                  onChange={(e) => {
                    const option = issueKeywordGroupOptions.find(
                      (item) => item.value === e.target.value,
                    );
                    updateGroup(idx, {
                      name: e.target.value,
                      weight: option?.defaultWeight ?? group.weight,
                    });
                  }}
                  className={inputClass}
                  style={inputStyle}
                >
                  {!issueKeywordGroupOptions.some(
                    (option) => option.value === group.name,
                  ) && (
                    <option value={group.name}>
                      {group.name || "Custom theme"}
                    </option>
                  )}
                  {issueKeywordGroupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span
                  className="mb-1 block text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Priority
                </span>
                <select
                  value={String(group.weight)}
                  onChange={(e) =>
                    updateGroup(idx, { weight: numeric(e.target.value, 5) })
                  }
                  className={inputClass}
                  style={inputStyle}
                >
                  {!issueWeightOptions.some(
                    (option) => option.value === group.weight,
                  ) && (
                    <option value={group.weight}>
                      {group.weight} - Custom
                    </option>
                  )}
                  {issueWeightOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} - {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span
                  className="mb-1 block text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Matching keywords
                </span>
                <textarea
                  value={group.keywordsText}
                  onChange={(e) =>
                    updateGroup(idx, { keywordsText: e.target.value })
                  }
                  placeholder="Comma or newline separated keywords"
                  rows={2}
                  className={textareaClass}
                  style={inputStyle}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    keywordGroups: prev.keywordGroups.filter(
                      (_, itemIdx) => itemIdx !== idx,
                    ),
                  }))
                }
                className="min-h-[44px] rounded-lg px-3 md:mt-5"
                style={{ color: "var(--danger)" }}
                title="Remove keyword group"
                aria-label="Remove keyword group"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addGroup}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent)",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add keyword group
          </button>
        </div>
      )}
    </section>
  );
}

function VolumeSection({
  state,
  setState,
}: {
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
}) {
  const updateRule = (idx: number, patch: Partial<VolumeRule>) => {
    setState((prev) => ({
      ...prev,
      volumeRules: prev.volumeRules.map((rule, ruleIdx) =>
        ruleIdx === idx ? { ...rule, ...patch } : rule,
      ),
    }));
  };

  return (
    <section className="rounded-lg p-4" style={cardStyle}>
      <SectionHeader
        icon={<Flame className="h-4 w-4" style={{ color: "var(--warning)" }} />}
        title="Conversation Spike"
        wiring="partial"
        description="Growth % is mapped to the issue_pressure signal. Metric, window, and baseline are stored but not used by the current scorer."
        enabled={state.volumeEnabled}
        onToggle={(value) =>
          setState((prev) => ({ ...prev, volumeEnabled: value }))
        }
      />
      {state.volumeEnabled && (
        <div className="space-y-3">
          <RuntimeNote wiring="partial">
            Active field: Growth %. It tunes thresholds for top issue pressure
            in the BI report, not raw mention count directly.
          </RuntimeNote>
          <div className="max-w-xs">
            <label
              className="mb-1 block text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Metric
            </label>
            <select
              value={state.volumeMetric}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  volumeMetric: e.target.value as EditorState["volumeMetric"],
                }))
              }
              className={inputClass}
              style={inputStyle}
            >
              <option value="MENTIONS">Mentions</option>
              <option value="ENGAGEMENT">Engagement</option>
              <option value="REACH">Reach</option>
            </select>
          </div>
          {state.volumeRules.map((rule, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-lg p-3 md:grid-cols-[130px_1fr_1fr_150px_auto]"
              style={{ background: "var(--bg-surface)" }}
            >
              <select
                value={rule.level}
                onChange={(e) =>
                  updateRule(idx, {
                    level: e.target.value as VolumeRule["level"],
                  })
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <NumberField
                label="Growth %"
                value={rule.threshold_percent_growth}
                onChange={(value) =>
                  updateRule(idx, { threshold_percent_growth: value })
                }
              />
              <NumberField
                label="Window hours"
                value={rule.comparison_window_hours}
                onChange={(value) =>
                  updateRule(idx, { comparison_window_hours: value })
                }
              />
              <select
                value={rule.baseline}
                onChange={(e) =>
                  updateRule(idx, {
                    baseline: e.target.value as VolumeRule["baseline"],
                  })
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="PREVIOUS_PERIOD">Previous period</option>
                <option value="AVERAGE_7D">Average 7D</option>
                <option value="AVERAGE_30D">Average 30D</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    volumeRules: prev.volumeRules.filter(
                      (_, itemIdx) => itemIdx !== idx,
                    ),
                  }))
                }
                className="min-h-[44px] rounded-lg px-3"
                style={{ color: "var(--danger)" }}
                aria-label="Remove volume rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddRuleButton
            onClick={() =>
              setState((prev) => ({
                ...prev,
                volumeRules: [...prev.volumeRules, defaultVolumeRule()],
              }))
            }
            label="Add volume rule"
          />
        </div>
      )}
    </section>
  );
}

function SentimentSection({
  state,
  setState,
}: {
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
}) {
  const updateRule = (idx: number, patch: Partial<SentimentRuleDraft>) => {
    setState((prev) => ({
      ...prev,
      sentimentRules: prev.sentimentRules.map((rule, ruleIdx) =>
        ruleIdx === idx ? { ...rule, ...patch } : rule,
      ),
    }));
  };

  return (
    <section className="rounded-lg p-4" style={cardStyle}>
      <SectionHeader
        icon={
          <SlidersHorizontal
            className="h-4 w-4"
            style={{ color: "var(--accent)" }}
          />
        }
        title="Negative Sentiment Share"
        wiring="partial"
        description="NEGATIVE_SPIKE threshold is active. Aspect-negative rules and sample-size guard are reserved for the next sentiment scorer."
        enabled={state.sentimentEnabled}
        onToggle={(value) =>
          setState((prev) => ({ ...prev, sentimentEnabled: value }))
        }
      />
      {state.sentimentEnabled && (
        <div className="space-y-3">
          <RuntimeNote wiring="partial">
            Active rule: Negative spike %. It tunes the sentiment_collapse proxy
            from SOV entity deltas.
          </RuntimeNote>
          <NumberField
            label="Minimum sample size"
            value={state.sentimentMinSampleSize}
            onChange={(value) =>
              setState((prev) => ({ ...prev, sentimentMinSampleSize: value }))
            }
          />
          {state.sentimentRules.map((rule, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-lg p-3 md:grid-cols-[160px_1fr_1fr_2fr_auto]"
              style={{ background: "var(--bg-surface)" }}
            >
              <select
                value={rule.type}
                onChange={(e) =>
                  updateRule(idx, {
                    type: e.target.value as SentimentRule["type"],
                  })
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="NEGATIVE_SPIKE">Negative spike</option>
                <option value="ASPECT_NEGATIVE">Aspect negative</option>
              </select>
              <NumberField
                label="Negative %"
                value={rule.threshold_percent ?? 0}
                onChange={(value) =>
                  updateRule(idx, { threshold_percent: value })
                }
              />
              <NumberField
                label="Aspect neg. %"
                value={rule.negative_threshold_percent ?? 0}
                onChange={(value) =>
                  updateRule(idx, { negative_threshold_percent: value })
                }
              />
              <textarea
                value={rule.criticalAspectsText ?? ""}
                onChange={(e) =>
                  updateRule(idx, { criticalAspectsText: e.target.value })
                }
                placeholder="critical aspects, comma separated"
                rows={2}
                className={textareaClass}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    sentimentRules: prev.sentimentRules.filter(
                      (_, itemIdx) => itemIdx !== idx,
                    ),
                  }))
                }
                className="min-h-[44px] rounded-lg px-3"
                style={{ color: "var(--danger)" }}
                aria-label="Remove sentiment rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddRuleButton
            onClick={() =>
              setState((prev) => ({
                ...prev,
                sentimentRules: [
                  ...prev.sentimentRules,
                  defaultSentimentRule(),
                ],
              }))
            }
            label="Add sentiment rule"
          />
        </div>
      )}
    </section>
  );
}

function InfluencerSection({
  state,
  setState,
}: {
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
}) {
  const updateRule = (idx: number, patch: Partial<InfluencerRule>) => {
    setState((prev) => ({
      ...prev,
      influencerRules: prev.influencerRules.map((rule, ruleIdx) =>
        ruleIdx === idx ? { ...rule, ...patch } : rule,
      ),
    }));
  };

  return (
    <section className="rounded-lg p-4" style={cardStyle}>
      <SectionHeader
        icon={<Users className="h-4 w-4" style={{ color: "var(--accent)" }} />}
        title="Influencer Amplification"
        wiring="partial"
        description="VIRAL_NEGATIVE comment count tunes controversy_spike. HIGH_REACH, followers, shares, sentiment, and AND/OR logic are reserved."
        enabled={state.influencerEnabled}
        onToggle={(value) =>
          setState((prev) => ({ ...prev, influencerEnabled: value }))
        }
      />
      {state.influencerEnabled && (
        <div className="space-y-3">
          <RuntimeNote wiring="partial">
            Active field: Viral negative comments. It changes thresholds for
            thread controversy score, which is why alerts can show
            controversy_spike.
          </RuntimeNote>
          <div className="max-w-xs">
            <label
              className="mb-1 block text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Matching logic
            </label>
            <select
              value={state.influencerLogic}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  influencerLogic: e.target.value as "AND" | "OR",
                }))
              }
              className={inputClass}
              style={inputStyle}
            >
              <option value="OR">OR</option>
              <option value="AND">AND</option>
            </select>
          </div>
          {state.influencerRules.map((rule, idx) => (
            <div
              key={idx}
              className="grid gap-2 rounded-lg p-3 md:grid-cols-[150px_1fr_140px_1fr_1fr_auto]"
              style={{ background: "var(--bg-surface)" }}
            >
              <select
                value={rule.type}
                onChange={(e) =>
                  updateRule(idx, {
                    type: e.target.value as InfluencerRule["type"],
                  })
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="VIRAL_NEGATIVE">Viral negative</option>
                <option value="HIGH_REACH">High reach (reserved)</option>
              </select>
              <NumberField
                label="Followers"
                value={rule.min_followers ?? 0}
                onChange={(value) => updateRule(idx, { min_followers: value })}
              />
              <select
                value={rule.required_sentiment ?? "NEGATIVE"}
                onChange={(e) =>
                  updateRule(idx, {
                    required_sentiment: e.target
                      .value as InfluencerRule["required_sentiment"],
                  })
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="NEGATIVE">Negative</option>
                <option value="NEUTRAL">Neutral</option>
              </select>
              <NumberField
                label="Shares"
                value={rule.min_shares ?? 0}
                onChange={(value) => updateRule(idx, { min_shares: value })}
              />
              <NumberField
                label="Comments"
                value={rule.min_comments ?? 0}
                onChange={(value) => updateRule(idx, { min_comments: value })}
              />
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    influencerRules: prev.influencerRules.filter(
                      (_, itemIdx) => itemIdx !== idx,
                    ),
                  }))
                }
                className="min-h-[44px] rounded-lg px-3"
                style={{ color: "var(--danger)" }}
                aria-label="Remove influencer rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddRuleButton
            onClick={() =>
              setState((prev) => ({
                ...prev,
                influencerRules: [
                  ...prev.influencerRules,
                  defaultInfluencerRule(),
                ],
              }))
            }
            label="Add influencer rule"
          />
        </div>
      )}
    </section>
  );
}

function ResponsePolicySection({
  state,
  setState,
}: {
  state: EditorState;
  setState: Dispatch<SetStateAction<EditorState>>;
}) {
  return (
    <section className="rounded-lg p-4" style={cardStyle}>
      <div className="mb-3 flex items-center gap-3">
        <RefreshCw className="h-4 w-4" style={{ color: "var(--accent)" }} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Response Policy
          </span>
          <RuntimeBadge wiring="active" />
        </div>
      </div>
      <RuntimeNote wiring="active">
        Fully wired. Adaptive crawling reacts from the selected level; user
        alerts and ops escalation use the notification threshold and repeat
        cooldown.
      </RuntimeNote>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="mb-3">
            <SwitchControl
              checked={state.adaptiveCrawlEnabled}
              onChange={(value) =>
                setState((prev) => ({ ...prev, adaptiveCrawlEnabled: value }))
              }
              label="Adaptive crawling"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span
                className="mb-1 block text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Boost crawling from
              </span>
              <select
                value={state.adaptiveTriggerLevel}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    adaptiveTriggerLevel: e.target
                      .value as EditorState["adaptiveTriggerLevel"],
                  }))
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="WATCH">Watch</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <NumberField
              label="Cooldown minutes"
              value={state.adaptiveCooldownMinutes}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  adaptiveCooldownMinutes: value,
                }))
              }
            />
          </div>
        </div>
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--bg-surface)" }}
        >
          <div className="mb-3">
            <SwitchControl
              checked={state.notificationEnabled}
              onChange={(value) =>
                setState((prev) => ({ ...prev, notificationEnabled: value }))
              }
              label="User alerts"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span
                className="mb-1 block text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                Notify users from
              </span>
              <select
                value={state.notificationTriggerLevel}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    notificationTriggerLevel: e.target
                      .value as EditorState["notificationTriggerLevel"],
                  }))
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </label>
            <NumberField
              label="Repeat cooldown"
              value={state.notificationCooldownMinutes}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  notificationCooldownMinutes: value,
                }))
              }
            />
          </div>
          <div className="mt-3">
            <SwitchControl
              checked={state.opsAlertOnCritical}
              onChange={(value) =>
                setState((prev) => ({ ...prev, opsAlertOnCritical: value }))
              }
              label="Escalate critical alerts to ops"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-[11px]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(numeric(e.target.value, 0))}
        className={inputClass}
        style={inputStyle}
      />
    </label>
  );
}

function AddRuleButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold"
      style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function normalizeConfig(
  config: CrisisConfig | CrisisConfigInput,
): EditorState {
  const fallback = buildDefaultCrisisConfig();
  const keywordTrigger = config.keywords_trigger ?? fallback.keywords_trigger!;
  const volumeTrigger = config.volume_trigger ?? fallback.volume_trigger!;
  const sentimentTrigger =
    config.sentiment_trigger ?? fallback.sentiment_trigger!;
  const influencerTrigger =
    config.influencer_trigger ?? fallback.influencer_trigger!;
  const defaultPolicy = buildDefaultResponsePolicy();
  const responsePolicy = {
    adaptive_crawl: {
      ...defaultPolicy.adaptive_crawl,
      ...(config.response_policy?.adaptive_crawl ?? {}),
    },
    notification: {
      ...defaultPolicy.notification,
      ...(config.response_policy?.notification ?? {}),
    },
  };

  return {
    status: config.status ?? "NORMAL",
    keywordEnabled: keywordTrigger.enabled,
    keywordLogic: keywordTrigger.logic,
    keywordGroups: (keywordTrigger.groups.length
      ? keywordTrigger.groups
      : fallback.keywords_trigger!.groups
    ).map((group) => ({
      name: group.name,
      keywordsText: group.keywords.join(", "),
      weight: group.weight,
    })),
    volumeEnabled: volumeTrigger.enabled,
    volumeMetric: volumeTrigger.metric,
    volumeRules: volumeTrigger.rules.length
      ? volumeTrigger.rules
      : fallback.volume_trigger!.rules,
    sentimentEnabled: sentimentTrigger.enabled,
    sentimentMinSampleSize: sentimentTrigger.min_sample_size,
    sentimentRules: (sentimentTrigger.rules.length
      ? sentimentTrigger.rules
      : fallback.sentiment_trigger!.rules
    ).map((rule) => ({
      ...rule,
      criticalAspectsText: rule.critical_aspects?.join(", ") ?? "",
    })),
    influencerEnabled: influencerTrigger.enabled,
    influencerLogic: influencerTrigger.logic,
    influencerRules: influencerTrigger.rules.length
      ? influencerTrigger.rules
      : fallback.influencer_trigger!.rules,
    adaptiveCrawlEnabled: responsePolicy.adaptive_crawl.enabled,
    adaptiveTriggerLevel: responsePolicy.adaptive_crawl.trigger_level,
    adaptiveCooldownMinutes: responsePolicy.adaptive_crawl.cooldown_minutes,
    notificationEnabled: responsePolicy.notification.enabled,
    notificationTriggerLevel: responsePolicy.notification.trigger_level,
    notificationCooldownMinutes:
      responsePolicy.notification.repeat_cooldown_minutes,
    opsAlertOnCritical: responsePolicy.notification.ops_alert_on_critical,
  };
}

function buildPayload(state: EditorState): CrisisConfigInput {
  return {
    status: state.status,
    keywords_trigger: {
      enabled: state.keywordEnabled,
      logic: state.keywordLogic,
      groups: state.keywordGroups.map((group) => ({
        name: group.name.trim() || "Risk group",
        keywords: splitList(group.keywordsText),
        weight: group.weight,
      })),
    },
    volume_trigger: {
      enabled: state.volumeEnabled,
      metric: state.volumeMetric,
      rules: state.volumeRules,
    },
    sentiment_trigger: {
      enabled: state.sentimentEnabled,
      min_sample_size: state.sentimentMinSampleSize,
      rules: state.sentimentRules.map((rule) => ({
        type: rule.type,
        threshold_percent: rule.threshold_percent,
        critical_aspects: splitList(rule.criticalAspectsText ?? ""),
        negative_threshold_percent: rule.negative_threshold_percent,
      })),
    },
    influencer_trigger: {
      enabled: state.influencerEnabled,
      logic: state.influencerLogic,
      rules: state.influencerRules,
    },
    response_policy: {
      adaptive_crawl: {
        enabled: state.adaptiveCrawlEnabled,
        trigger_level: state.adaptiveTriggerLevel,
        cooldown_minutes: state.adaptiveCooldownMinutes,
      },
      notification: {
        enabled: state.notificationEnabled,
        trigger_level: state.notificationTriggerLevel,
        repeat_cooldown_minutes: state.notificationCooldownMinutes,
        ops_alert_on_critical: state.opsAlertOnCritical,
      },
    },
  };
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numeric(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function defaultVolumeRule(): VolumeRule {
  return {
    level: "WARNING",
    threshold_percent_growth: 150,
    comparison_window_hours: 6,
    baseline: "AVERAGE_7D",
  };
}

function defaultSentimentRule(): SentimentRuleDraft {
  return {
    type: "NEGATIVE_SPIKE",
    threshold_percent: 35,
    criticalAspectsText: "",
    negative_threshold_percent: 0,
  };
}

function defaultInfluencerRule(): InfluencerRule {
  return {
    type: "VIRAL_NEGATIVE",
    min_followers: 0,
    required_sentiment: "NEGATIVE",
    min_shares: 0,
    min_comments: 150,
  };
}
