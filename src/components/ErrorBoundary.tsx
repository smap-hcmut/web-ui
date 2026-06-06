'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Optional UI to render in place of the crashed subtree. */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Reported alongside the console log so support can correlate to a screen. */
  scope?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Stops a runtime error in one tab (e.g. a failed analytics query) from
 * crashing the whole SMAP shell. Logs the error so the network panel
 * still shows the failing request, and offers a reset hook so the parent
 * can drop the boundary state when the user retries.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep this surface narrow: log the scope + error so devtools can group
    // them; an external observability hook can subscribe to window error
    // events instead of being wired here.
    const scope = this.props.scope ?? 'unknown';
    // eslint-disable-next-line no-console
    console.error(`[smap:error-boundary:${scope}]`, error, info.componentStack);
  }

  reset = (): void => this.setState({ error: null });

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    if (typeof this.props.fallback === 'function') {
      return this.props.fallback(this.state.error, this.reset);
    }
    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    return (
      <div className="rounded-lg border border-red-400/40 bg-red-50 p-6 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">
        <div className="font-semibold">Đã có lỗi xảy ra ở khu vực này.</div>
        <div className="mt-1 opacity-80">
          Thử tải lại; nếu vẫn còn, mở Console để xem chi tiết.
        </div>
        <button
          type="button"
          onClick={this.reset}
          className="mt-3 rounded border border-red-400/50 px-3 py-1 text-xs hover:bg-red-100/60 dark:hover:bg-red-900/40"
        >
          Reset
        </button>
      </div>
    );
  }
}
