'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  Loader2,
  Clock,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface ProcessingStage {
  label: string;
  status: 'done' | 'active' | 'pending' | 'error';
  duration?: number; // ms to simulate
}

const INITIAL_STAGES: ProcessingStage[] = [
  { label: 'Creating campaign...', status: 'active', duration: 1500 },
  { label: 'Setting up projects...', status: 'pending', duration: 1800 },
  { label: 'Crawling data from TikTok...', status: 'pending', duration: 3000 },
  { label: 'Crawling data from Facebook...', status: 'pending', duration: 2500 },
  { label: 'Crawling data from YouTube...', status: 'pending', duration: 2800 },
  { label: 'Analyzing sentiment...', status: 'pending', duration: 2000 },
  { label: 'Building insights...', status: 'pending', duration: 1500 },
];

export default function ProcessingPage() {
  return (
    <Suspense>
      <ProcessingContent />
    </Suspense>
  );
}

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campId = searchParams.get('camp_id') || 'new';

  const [stages, setStages] = useState<ProcessingStage[]>(INITIAL_STAGES);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [complete, setComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const totalStages = INITIAL_STAGES.length;
  const doneCount = stages.filter((s) => s.status === 'done').length;
  const progress = complete ? 100 : Math.round((doneCount / totalStages) * 100);

  const advanceStage = useCallback(() => {
    setStages((prev) => {
      const next = [...prev];
      // Mark current as done
      if (next[currentIdx]) {
        next[currentIdx] = { ...next[currentIdx], status: 'done' };
      }
      // Mark next as active
      const nextIdx = currentIdx + 1;
      if (nextIdx < next.length) {
        next[nextIdx] = { ...next[nextIdx], status: 'active' };
      }
      return next;
    });
    setCurrentIdx((prev) => prev + 1);
  }, [currentIdx]);

  useEffect(() => {
    if (currentIdx >= totalStages) {
      setComplete(true);
      return;
    }
    if (hasError) return;

    const stage = INITIAL_STAGES[currentIdx];
    const timer = setTimeout(() => {
      advanceStage();
    }, stage.duration || 2000);

    return () => clearTimeout(timer);
  }, [currentIdx, totalStages, hasError, advanceStage]);

  const handleRetry = () => {
    setHasError(false);
    setStages(INITIAL_STAGES);
    setCurrentIdx(0);
    setComplete(false);
  };

  const StageIcon = ({ status }: { status: ProcessingStage['status'] }) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />;
      case 'active':
        return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />;
      case 'error':
        return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--danger)' }} />;
      default:
        return <Clock className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />;
    }
  };

  return (
    <div className="min-h-screen bg-grid relative flex items-center justify-center p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="orb w-[700px] h-[700px] top-[20%] left-[50%] -translate-x-1/2"
          style={{
            background: 'radial-gradient(circle, var(--accent-subtle) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Floating particles decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="heap-particle absolute rounded-full"
            style={{
              width: 4 + i * 2,
              height: 4 + i * 2,
              background: 'var(--accent)',
              opacity: 0.06 + i * 0.01,
              left: `${15 + i * 14}%`,
              top: `${20 + i * 10}%`,
              '--dur': `${18 + i * 4}s`,
              '--p-op': `${0.04 + i * 0.01}`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent-subtle)' }}
          >
            <Layers className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <h1
            className="text-[18px] font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {complete ? 'Your campaign is ready!' : 'Setting up your campaign'}
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {complete
              ? 'All data has been crawled and analyzed successfully.'
              : 'We\'re crawling social platforms and building your insights.'}
          </p>
        </div>

        {/* Progress card */}
        <div
          className="rounded-2xl p-6 animate-[fadeIn_300ms_ease]"
          style={{
            background: 'var(--bg-surface-solid)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Overall progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                Overall progress
              </span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {progress}%
              </span>
            </div>
            <ProgressBar value={progress} size="md" />
          </div>

          {/* Stages */}
          <div className="space-y-1">
            {stages.map((stage, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300"
                style={{
                  background: stage.status === 'active' ? 'var(--accent-subtle)' : 'transparent',
                  opacity: stage.status === 'pending' ? 0.5 : 1,
                }}
              >
                <StageIcon status={stage.status} />
                <span
                  className="text-[13px] flex-1"
                  style={{
                    color:
                      stage.status === 'done'
                        ? 'var(--text-muted)'
                        : stage.status === 'active'
                          ? 'var(--text-primary)'
                          : 'var(--text-faint)',
                    textDecoration: stage.status === 'done' ? 'line-through' : 'none',
                  }}
                >
                  {stage.label}
                </span>
                {stage.status === 'done' && (
                  <span className="text-[10px] font-medium" style={{ color: 'var(--success)' }}>
                    Done
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            {hasError ? (
              <div className="text-center">
                <p className="text-[12px] mb-3" style={{ color: 'var(--danger)' }}>
                  Something went wrong. Please try again.
                </p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : complete ? (
              <button
                onClick={() => router.push(`/smap?camp_id=${campId}`)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-white transition-all duration-200"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                }}
              >
                View Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <p
                className="text-center text-[11px]"
                style={{ color: 'var(--text-faint)' }}
              >
                This may take a few minutes. You can leave this page — we&apos;ll notify you when it&apos;s ready.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
