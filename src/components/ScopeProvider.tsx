'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/* ── Non-linear multi-select scope ──
   /smap belongs to ONE campaign, identified by `camp_id` URL param (read-only).
   User can cherry-pick within that campaign:
   - individual projects (all their keywords included)
   - individual keywords
   When nothing is selected → all data for the active campaign is included.

   Scope is synced to URL search params so links are shareable.
   Params: camp_id=xxx  proj=id1,id2  kw=keyword1,keyword2
*/

interface ScopeState {
  projectIds: Set<string>;
  keywordIds: Set<string>;
}

interface ScopeContextValue {
  /** The active campaign ID from URL (read-only) */
  activeCampaignId: string | null;

  /** Selected IDs within the active campaign */
  projectIds: Set<string>;
  keywordIds: Set<string>;

  /** Toggle actions */
  toggleProject: (id: string) => void;
  toggleKeyword: (id: string) => void;
  clearAll: () => void;

  /** Is anything selected? */
  hasSelection: boolean;

  /** Total selection count for badge */
  selectionCount: number;
}

const ScopeContext = createContext<ScopeContextValue>(null!);

export function useScope() {
  return useContext(ScopeContext);
}

/** Parse comma-separated param into Set */
function paramToSet(value: string | null): Set<string> {
  if (!value) return new Set();
  return new Set(value.split(',').filter(Boolean));
}

/** Set to comma-separated param string (empty → null) */
function setToParam(s: Set<string>): string | null {
  if (s.size === 0) return null;
  return Array.from(s).join(',');
}

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read camp_id as read-only context
  const activeCampaignId = searchParams.get('camp_id');

  // Track previous camp_id to detect campaign switches
  const prevCampIdRef = useRef(activeCampaignId);

  // Hydrate initial state from URL params
  const [scope, setScope] = useState<ScopeState>(() => ({
    projectIds: paramToSet(searchParams.get('proj')),
    keywordIds: paramToSet(searchParams.get('kw')),
  }));

  // Reset scope when campaign changes
  useEffect(() => {
    if (prevCampIdRef.current !== activeCampaignId) {
      prevCampIdRef.current = activeCampaignId;
      setScope({ projectIds: new Set(), keywordIds: new Set() });
    }
  }, [activeCampaignId]);

  // Sync state → URL (without page reload)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const projParam = setToParam(scope.projectIds);
    const kwParam = setToParam(scope.keywordIds);

    if (projParam) params.set('proj', projParam); else params.delete('proj');
    if (kwParam) params.set('kw', kwParam); else params.delete('kw');

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (newQuery !== currentQuery) {
      router.replace(`${pathname}${newQuery ? `?${newQuery}` : ''}`, { scroll: false });
    }
  }, [scope, pathname, router, searchParams]);

  const toggleProject = useCallback((id: string) => {
    setScope((prev) => {
      const next = new Set(prev.projectIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, projectIds: next };
    });
  }, []);

  const toggleKeyword = useCallback((id: string) => {
    setScope((prev) => {
      const next = new Set(prev.keywordIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, keywordIds: next };
    });
  }, []);

  const clearAll = useCallback(() => {
    setScope({ projectIds: new Set(), keywordIds: new Set() });
  }, []);

  const hasSelection = scope.projectIds.size > 0 || scope.keywordIds.size > 0;

  const selectionCount = scope.projectIds.size + scope.keywordIds.size;

  const value = useMemo(
    () => ({
      activeCampaignId,
      projectIds: scope.projectIds,
      keywordIds: scope.keywordIds,
      toggleProject,
      toggleKeyword,
      clearAll,
      hasSelection,
      selectionCount,
    }),
    [
      activeCampaignId,
      scope.projectIds,
      scope.keywordIds,
      toggleProject,
      toggleKeyword,
      clearAll,
      hasSelection,
      selectionCount,
    ],
  );

  return (
    <ScopeContext.Provider value={value}>
      {children}
    </ScopeContext.Provider>
  );
}
