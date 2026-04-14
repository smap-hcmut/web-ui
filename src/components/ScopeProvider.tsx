'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { campaigns, type Keyword } from '@/lib/mock-campaigns';

/* ── Non-linear multi-select scope ──
   User can cherry-pick any combination:
   - whole campaigns (all their keywords included)
   - individual projects (all their keywords included)
   - individual keywords
   When nothing is selected → everything is included (default "all")
*/

interface ScopeState {
  campaignIds: Set<string>;
  projectIds: Set<string>;
  keywordIds: Set<string>;
}

interface ScopeContextValue {
  /** Selected IDs */
  campaignIds: Set<string>;
  projectIds: Set<string>;
  keywordIds: Set<string>;

  /** Toggle actions */
  toggleCampaign: (id: string) => void;
  toggleProject: (id: string) => void;
  toggleKeyword: (id: string) => void;
  clearAll: () => void;

  /** Is anything selected? */
  hasSelection: boolean;

  /** Resolved keywords based on current selection */
  scopedKeywords: Keyword[];

  /** Total selection count for badge */
  selectionCount: number;
}

const ScopeContext = createContext<ScopeContextValue>(null!);

export function useScope() {
  return useContext(ScopeContext);
}

/** All keywords in the system */
const allKeywords = campaigns.flatMap((c) => c.projects.flatMap((p) => p.keywords));

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScope] = useState<ScopeState>({
    campaignIds: new Set(),
    projectIds: new Set(),
    keywordIds: new Set(),
  });

  const toggleCampaign = useCallback((id: string) => {
    setScope((prev) => {
      const next = new Set(prev.campaignIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, campaignIds: next };
    });
  }, []);

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
    setScope({ campaignIds: new Set(), projectIds: new Set(), keywordIds: new Set() });
  }, []);

  const hasSelection = scope.campaignIds.size > 0 || scope.projectIds.size > 0 || scope.keywordIds.size > 0;

  const selectionCount = scope.campaignIds.size + scope.projectIds.size + scope.keywordIds.size;

  const scopedKeywords = useMemo(() => {
    if (!hasSelection) return allKeywords;

    const result = new Map<string, Keyword>();

    // Add all keywords from selected campaigns
    for (const camp of campaigns) {
      if (scope.campaignIds.has(camp.id)) {
        for (const proj of camp.projects) {
          for (const kw of proj.keywords) {
            result.set(kw.id, kw);
          }
        }
      }
    }

    // Add all keywords from selected projects
    for (const camp of campaigns) {
      for (const proj of camp.projects) {
        if (scope.projectIds.has(proj.id)) {
          for (const kw of proj.keywords) {
            result.set(kw.id, kw);
          }
        }
      }
    }

    // Add individually selected keywords
    for (const camp of campaigns) {
      for (const proj of camp.projects) {
        for (const kw of proj.keywords) {
          if (scope.keywordIds.has(kw.id)) {
            result.set(kw.id, kw);
          }
        }
      }
    }

    return Array.from(result.values());
  }, [hasSelection, scope.campaignIds, scope.projectIds, scope.keywordIds]);

  return (
    <ScopeContext.Provider
      value={{
        campaignIds: scope.campaignIds,
        projectIds: scope.projectIds,
        keywordIds: scope.keywordIds,
        toggleCampaign,
        toggleProject,
        toggleKeyword,
        clearAll,
        hasSelection,
        scopedKeywords,
        selectionCount,
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
}
