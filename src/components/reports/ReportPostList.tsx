'use client';

import { useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ReportPostRow } from './ReportPostRow';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageCircle } from 'lucide-react';
import type { ReportPost } from '@/lib/types';

interface Props {
  posts: ReportPost[];
  isLoading?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  /** The scrollable viewport height. */
  height: number;
  /** Estimated row height for the virtualiser. */
  estimatedSize?: number;
}

export function ReportPostList({
  posts,
  isLoading,
  selectedIds,
  onToggleSelect,
  height,
  estimatedSize = 180,
}: Props) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedSize,
    overscan: 6,
  });

  // Stable per-row toggle reference so memoised rows don't re-render on
  // unrelated state changes. The caller already provides a stable fn, but we
  // wrap in useCallback for symmetry.
  const handleToggle = useCallback((id: string) => onToggleSelect(id), [onToggleSelect]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="card" height={150} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return <EmptyState icon={<MessageCircle />} title="No posts" description="This report has no posts yet." />;
  }

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      style={{ height, overflow: 'auto' }}
      className="pr-1"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((v) => {
          const post = posts[v.index];
          return (
            <div
              key={post.id}
              data-index={v.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform: `translateY(${v.start}px)`,
                paddingBottom: 12,
              }}
            >
              <ReportPostRow
                post={post}
                selected={selectedIds.has(post.id)}
                onToggleSelect={handleToggle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
