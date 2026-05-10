export interface AnalyticsScopeParams {
  sourceKind?: string;
  projectIds?: readonly string[];
  keywords?: readonly string[];
  contentType?: string;
}

export function normalizeAnalyticsScope(scope?: AnalyticsScopeParams | string): AnalyticsScopeParams {
  if (typeof scope === 'string') return { sourceKind: scope };
  return scope ?? {};
}

export function analyticsScopeKey(scope?: AnalyticsScopeParams | string, includeContentType = false) {
  const normalized = normalizeAnalyticsScope(scope);
  return {
    sourceKind: normalized.sourceKind ?? 'all',
    projectIds: [...(normalized.projectIds ?? [])].sort(),
    keywords: [...(normalized.keywords ?? [])].sort(),
    ...(includeContentType ? { contentType: normalized.contentType ?? 'all' } : {}),
  };
}

export function appendAnalyticsScope(
  params: URLSearchParams,
  scope?: AnalyticsScopeParams | string,
  includeContentType = false,
) {
  const normalized = normalizeAnalyticsScope(scope);
  if (normalized.sourceKind && normalized.sourceKind !== 'all') {
    params.set('sourceKind', normalized.sourceKind);
  }
  if (normalized.projectIds?.length) {
    params.set('projectIds', normalized.projectIds.join(','));
  }
  if (normalized.keywords?.length) {
    params.set('keywords', normalized.keywords.join(','));
  }
  if (includeContentType && normalized.contentType && normalized.contentType !== 'all') {
    params.set('contentType', normalized.contentType);
  }
}
