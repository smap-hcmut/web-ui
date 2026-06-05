'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FlaskConical, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import {
  projectApi,
  type OntologyMatchMode,
  type OntologySignalRule,
  type OntologyTargetKind,
  type ProjectOntologyRules,
} from '@/lib/api/projects';

type DraftRule = Omit<OntologySignalRule, 'phrases' | 'patterns' | 'negative_phrases'> & {
  phrasesText: string;
  patternsText: string;
  negativeText: string;
};

type Props = {
  projectId: string;
  projectName?: string;
};

const KIND_OPTIONS: Array<{ value: OntologyTargetKind; label: string }> = [
  { value: 'TOPIC', label: 'Conversation Topic' },
  { value: 'ASPECT', label: 'Brand Experience Aspect' },
  { value: 'ISSUE', label: 'Issue Signal' },
];

const KEY_OPTIONS: Record<OntologyTargetKind, Array<{ value: string; label: string }>> = {
  TOPIC: [
    { value: 'delivery_operations', label: 'Delivery Operations' },
    { value: 'pricing_and_promotions', label: 'Pricing & Promotions' },
    { value: 'courier_capacity', label: 'Courier Capacity' },
    { value: 'app_and_payment', label: 'App & Payment' },
    { value: 'support_and_recovery', label: 'Support & Recovery' },
    { value: 'trust_and_safety', label: 'Trust & Safety' },
    { value: 'service_comparison', label: 'Competitor Comparison' },
  ],
  ASPECT: [
    { value: 'delivery_speed', label: 'Delivery Speed' },
    { value: 'delivery_fee', label: 'Delivery Fee' },
    { value: 'driver_quality', label: 'Driver Quality' },
    { value: 'package_safety', label: 'Package Safety' },
    { value: 'app_experience', label: 'App Experience' },
    { value: 'payment', label: 'Payment' },
    { value: 'support_resolution', label: 'Support Resolution' },
  ],
  ISSUE: [
    { value: 'late_delivery', label: 'Late Delivery' },
    { value: 'high_fee', label: 'High Fee' },
    { value: 'hidden_fee', label: 'Hidden Fee' },
    { value: 'driver_shortage', label: 'Driver Shortage' },
    { value: 'driver_attitude_problem', label: 'Driver Attitude Problem' },
    { value: 'payment_problem', label: 'Payment Problem' },
    { value: 'app_instability', label: 'App Instability' },
    { value: 'support_problem', label: 'Support Problem' },
    { value: 'fraud_concern', label: 'Fraud Concern' },
  ],
};

const inputClass = 'w-full px-3 py-2 rounded-lg text-[12px] outline-none transition-all';
const inputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--text-primary)',
};

function newRule(): DraftRule {
  return {
    id: undefined,
    label: 'Delivery fee complaints',
    description: '',
    target_kind: 'ISSUE',
    target_key: 'high_fee',
    match_mode: 'ANY',
    phrasesText: 'phí cao\nphí ship cao\nship mắc\ngiá giao hàng',
    patternsText: '',
    negativeText: 'miễn phí',
    enabled: true,
    weight: 5,
    sample_text: '',
  };
}

function toDraft(rule: OntologySignalRule): DraftRule {
  return {
    ...rule,
    phrasesText: (rule.phrases ?? []).join('\n'),
    patternsText: (rule.patterns ?? []).join('\n'),
    negativeText: (rule.negative_phrases ?? []).join('\n'),
  };
}

function splitLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPayloadRule(rule: DraftRule): OntologySignalRule {
  return {
    id: rule.id,
    label: rule.label.trim(),
    description: rule.description?.trim(),
    target_kind: rule.target_kind,
    target_key: rule.target_key.trim(),
    match_mode: rule.match_mode,
    phrases: splitLines(rule.phrasesText),
    patterns: splitLines(rule.patternsText),
    negative_phrases: splitLines(rule.negativeText),
    enabled: rule.enabled,
    weight: Number(rule.weight) || 1,
    sample_text: rule.sample_text?.trim(),
  };
}

export function OntologyRulesEditor({ projectId, projectName }: Props) {
  const [enabled, setEnabled] = useState(true);
  const [rules, setRules] = useState<DraftRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sampleText, setSampleText] = useState('Phí ship cao quá, app báo giá khác lúc thanh toán.');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [testSummary, setTestSummary] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    projectApi
      .getOntologyRules(projectId)
      .then((config: ProjectOntologyRules) => {
        if (!mounted) return;
        setEnabled(config.enabled ?? true);
        setRules((config.rules ?? []).length ? config.rules.map(toDraft) : [newRule()]);
        setMessage(null);
      })
      .catch(() => {
        if (!mounted) return;
        setEnabled(true);
        setRules([newRule()]);
        setMessage({ type: 'info', text: 'No saved signal dictionary yet. A draft rule is ready.' });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const payload = useMemo(() => ({ enabled, rules: rules.map(toPayloadRule) }), [enabled, rules]);

  const updateRule = (index: number, patch: Partial<DraftRule>) => {
    setRules((current) => current.map((rule, idx) => (idx === index ? { ...rule, ...patch } : rule)));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await projectApi.upsertOntologyRules(projectId, payload);
      setEnabled(saved.enabled ?? true);
      setRules((saved.rules ?? []).map(toDraft));
      setMessage({ type: 'success', text: 'Signal dictionary saved. New analysis batches will use these rules.' });
    } catch (error) {
      const apiError = error as { message?: string };
      setMessage({ type: 'error', text: apiError.message || 'Could not save signal dictionary.' });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTestSummary('');
    try {
      const matches = await projectApi.testOntologyRules(projectId, { ...payload, text: sampleText });
      const matched = matches.filter((item) => item.matched);
      setTestSummary(
        matched.length
          ? matched.map((item) => `${item.label}: ${item.evidence.join(', ')}`).join(' · ')
          : 'No rule matched this sample.',
      );
    } catch (error) {
      const apiError = error as { message?: string };
      setTestSummary(apiError.message || 'Could not test these rules.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading signal dictionary...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Signal Dictionary
          </h2>
          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Tune how SMAP recognizes topics, issues, and brand-experience aspects for {projectName || 'this project'}.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Use project rules
        </label>
      </div>

      {message ? (
        <div
          className="rounded-lg px-3 py-2 text-[12px]"
          style={{
            background: message.type === 'error' ? 'var(--danger-bg)' : message.type === 'success' ? 'var(--success-subtle)' : 'var(--accent-subtle)',
            color: message.type === 'error' ? 'var(--danger)' : message.type === 'success' ? 'var(--success)' : 'var(--accent)',
          }}
        >
          {message.text}
        </div>
      ) : null}

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={`${rule.id || 'rule'}-${index}`} className="rounded-lg p-4" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: rule.enabled ? 'var(--success)' : 'var(--text-faint)' }} />
                <input
                  value={rule.label}
                  onChange={(event) => updateRule(index, { label: event.target.value })}
                  className="w-full bg-transparent text-[13px] font-semibold outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={rule.enabled} onChange={(event) => updateRule(index, { enabled: event.target.checked })} />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => setRules((current) => current.filter((_, idx) => idx !== index))}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--danger)' }}
                  aria-label="Remove rule"
                  title="Remove rule"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Signal type</label>
                <select value={rule.target_kind} onChange={(event) => updateRule(index, { target_kind: event.target.value as OntologyTargetKind, target_key: KEY_OPTIONS[event.target.value as OntologyTargetKind][0]?.value || '' })} className={inputClass} style={inputStyle}>
                  {KIND_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Classify as</label>
                <input list={`ontology-key-${index}`} value={rule.target_key} onChange={(event) => updateRule(index, { target_key: event.target.value })} className={inputClass} style={inputStyle} />
                <datalist id={`ontology-key-${index}`}>
                  {KEY_OPTIONS[rule.target_kind].map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Match logic</label>
                <select value={rule.match_mode} onChange={(event) => updateRule(index, { match_mode: event.target.value as OntologyMatchMode })} className={inputClass} style={inputStyle}>
                  <option value="ANY">Any phrase or pattern</option>
                  <option value="ALL">All phrases and patterns</option>
                  <option value="REGEX">Advanced pattern first</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Strength</label>
                <input type="number" min={1} max={100} value={rule.weight} onChange={(event) => updateRule(index, { weight: Number(event.target.value) })} className={inputClass} style={inputStyle} />
              </div>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Marketing phrases</label>
                <textarea value={rule.phrasesText} onChange={(event) => updateRule(index, { phrasesText: event.target.value })} rows={4} className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Advanced patterns</label>
                <textarea value={rule.patternsText} onChange={(event) => updateRule(index, { patternsText: event.target.value })} rows={4} className={`${inputClass} resize-none font-mono`} style={inputStyle} placeholder="phi\\s+(ship|giao).*cao" />
              </div>
              <div>
                <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Exclude when text contains</label>
                <textarea value={rule.negativeText} onChange={(event) => updateRule(index, { negativeText: event.target.value })} rows={4} className={`${inputClass} resize-none`} style={inputStyle} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <label className="mb-1 block text-[11px]" style={{ color: 'var(--text-secondary)' }}>Test sample</label>
        <div className="flex flex-col gap-2 lg:flex-row">
          <input value={sampleText} onChange={(event) => setSampleText(event.target.value)} className={inputClass} style={inputStyle} />
          <button type="button" onClick={test} disabled={testing} className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold disabled:opacity-60" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
            Test
          </button>
        </div>
        {testSummary ? <p className="mt-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>{testSummary}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRules((current) => [...current, newRule()])} className="flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </button>
        <button type="button" onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-60" style={{ background: 'var(--accent)' }}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save dictionary
        </button>
      </div>
    </div>
  );
}
