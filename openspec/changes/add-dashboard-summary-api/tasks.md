# Implementation Tasks

## 1. Backend API Integration

### 1.1 Summary API
- [ ] 1.1.1 Add `DashboardSummary` TypeScript interface in `dashboard.service.ts`
- [ ] 1.1.2 Add `getDashboardSummary()` method to `dashboardService` object
- [ ] 1.1.3 Implement error handling and timeout for summary API (5s timeout)
- [ ] 1.1.4 Add JSDoc documentation for summary types and methods
- [ ] 1.1.5 Write unit tests for summary API parsing and error handling

### 1.2 Top Keywords API
- [ ] 1.2.1 Add `TopKeywordsResponse`, `KeywordData`, `KeywordRank` TypeScript interfaces in `dashboard.service.ts`
- [ ] 1.2.2 Add `getTopKeywords()` method to `dashboardService` object with parameters `projectId`, `limit`, `includeRankFor`
- [ ] 1.2.3 Implement query string building for `include_rank_for` parameter (comma-separated)
- [ ] 1.2.4 Implement error handling and timeout for top-keywords API (3s timeout)
- [ ] 1.2.5 Add JSDoc documentation for keywords types and methods
- [ ] 1.2.6 Write unit tests for top-keywords API parsing, parameter handling, and error cases

## 2. Data Transformation Utilities

- [ ] 2.1 Update `dashboardDataTransform.ts` to accept summary data as input
- [ ] 2.2 Create `useSummaryData()` helper function to prefer summary over calculated metrics
- [ ] 2.3 Add fallback logic: if summary unavailable, calculate from posts
- [ ] 2.4 Ensure all metric calculations match between summary and posts-based calculation
- [ ] 2.5 Write unit tests for transformation logic with both data sources

## 3. Custom Hook Implementation

- [ ] 3.1 Update `useDashboardData.ts` to fetch summary, top-keywords, and posts (three-phase)
- [ ] 3.2 Implement three-phase loading strategy:
  - [ ] 3.2.1 Phase 1: Fetch summary immediately
  - [ ] 3.2.2 Phase 2: Fetch top-keywords in parallel or after summary
  - [ ] 3.2.3 Phase 3: Fetch posts in background
- [ ] 3.3 Add separate cache keys:
  - [ ] 3.3.1 Summary: `dashboard:summary:${projectId}`
  - [ ] 3.3.2 Keywords: `dashboard:keywords:${projectId}`
  - [ ] 3.3.3 Posts: `dashboard:posts:${projectId}`
- [ ] 3.4 Configure cache TTL: 3min for summary, 5min for keywords, 10min for posts
- [ ] 3.5 Implement stale-while-revalidate for all 3 APIs
- [ ] 3.6 Add loading states for each phase (`loadingSummary`, `loadingKeywords`, `loadingPosts`)
- [ ] 3.7 Handle errors independently for each API with fallback logic
- [ ] 3.8 Get project keywords from project config/context to pass to `include_rank_for` parameter

## 4. Context Updates

- [ ] 4.1 Update `DashboardContext.tsx` to include summary and keywords state
- [ ] 4.2 Add to state:
  - [ ] 4.2.1 `dashboardSummary: DashboardSummary | null`
  - [ ] 4.2.2 `topKeywords: TopKeywordsResponse | null`
  - [ ] 4.2.3 `summaryError`, `keywordsError`, `postsError: string | null`
  - [ ] 4.2.4 `summaryLoading`, `keywordsLoading`, `postsLoading: boolean`
- [ ] 4.3 Update context actions to handle summary, keywords and posts data separately
- [ ] 4.4 Implement cache invalidation for all 3 data sources on project change
- [ ] 4.5 Add action to manually refresh specific data source (e.g., retry keywords only)

## 5. Component Updates

- [ ] 5.1 Update `DashboardGrid.tsx` to use summary data for metrics cards
- [ ] 5.2 Show metrics cards immediately when summary loads (before posts/keywords)
- [ ] 5.3 Display loading spinner for TopicCloud until keywords load
- [ ] 5.4 Display loading spinner for viral/time-series charts until posts load
- [ ] 5.5 Update `MetricCard.tsx` to accept data from summary structure
- [ ] 5.6 Update sentiment/risk distribution visualizations to use summary distributions
- [ ] 5.7 Pass topKeywords data to TopicCloud component
- [ ] 5.8 Ensure ViralPosts, UnifiedChart still use posts data (not keywords)

## 5B. TopicCloud UI Redesign

### 5B.1 Aspect-Based Color Coding
- [ ] 5B.1.1 Add aspect color mapping constants (PRICE/PERFORMANCE/DESIGN/SERVICE)
- [ ] 5B.1.2 Update word cloud color function to use aspect instead of sentiment
- [ ] 5B.1.3 Handle null/undefined aspect with default gray color
- [ ] 5B.1.4 Add color legend showing aspect meanings below cloud

### 5B.2 Ranking Table Component
- [ ] 5B.2.1 Create `KeywordRankingTable` component in `TopicCloud.tsx` or separate file
- [ ] 5B.2.2 Implement table structure with sections:
  - [ ] "🏆 TOP 5 KEYWORDS" section
  - [ ] "📊 OTHER KEYWORDS" section
- [ ] 5B.2.3 Add table columns: Rank, Keyword, Aspect, Sentiment Bar
- [ ] 5B.2.4 Style top 5 keywords with gold/accent background
- [ ] 5B.2.5 Add "Top 5" badge for rank < 5 keywords
- [ ] 5B.2.6 Display "20+" for keywords not in top 20 (rank=null, in_top=false)
- [ ] 5B.2.7 Add sentiment breakdown bar visualization (POSITIVE/NEUTRAL/NEGATIVE percentages)

### 5B.3 Integration with Top-Keywords API
- [ ] 5B.3.1 Update `TopicCloud` component to accept `topKeywordsData` prop
- [ ] 5B.3.2 Map `keywords` array to word cloud format (text, value, aspect)
- [ ] 5B.3.3 Map `input_keyword_ranks` array to ranking table format
- [ ] 5B.3.4 Sort ranking table: rank < 5 first, then rank >= 5, then no rank
- [ ] 5B.3.5 Handle empty `input_keyword_ranks` (project without keywords) - hide ranking table

### 5B.4 Fallback to Posts Data
- [ ] 5B.4.1 Keep existing keyword extraction logic from posts as fallback
- [ ] 5B.4.2 Show warning when using fallback: "Keyword aspects unavailable"
- [ ] 5B.4.3 Display cloud without aspect colors when falling back

## 6. Error Handling & UX

- [ ] 6.1 Implement error boundaries for all API failures (summary, keywords, posts)
- [ ] 6.2 Show fallback message when posts API fails but summary+keywords succeed
- [ ] 6.3 Show fallback message when keywords API fails (display cloud without aspects)
- [ ] 6.4 Display "Using cached data" banner when all 3 APIs fail but cache exists
- [ ] 6.5 Add retry button for failed API calls (allow retry specific API only)
- [ ] 6.6 Display last update timestamp for summary, keywords, and posts separately
- [ ] 6.7 Add loading skeletons for metrics cards during summary fetch
- [ ] 6.8 Add loading spinner for TopicCloud during keywords fetch
- [ ] 6.9 Handle case where project has no configured keywords (hide ranking table gracefully)

## 7. Testing

- [ ] 7.1 Write integration tests for three-phase loading
- [ ] 7.2 Test fallback scenarios:
  - [ ] 7.2.1 Summary fails, keywords+posts succeed
  - [ ] 7.2.2 Keywords fail, summary+posts succeed
  - [ ] 7.2.3 Posts fail, summary+keywords succeed
  - [ ] 7.2.4 All 3 fail with and without cache
- [ ] 7.3 Test cache invalidation on project change (all 3 caches)
- [ ] 7.4 Test stale-while-revalidate behavior for all 3 APIs
- [ ] 7.5 Test manual refresh clears all 3 caches
- [ ] 7.6 Verify metrics calculated from summary match metrics from posts
- [ ] 7.7 Test error states and retry functionality for each API
- [ ] 7.8 Test TopicCloud with aspect colors from keywords API
- [ ] 7.9 Test ranking table with various keyword ranks (<5, >=5, null)
- [ ] 7.10 Test project without configured keywords (ranking table hidden)

## 8. Documentation

- [ ] 8.1 Update `CHART_DATA_STRUCTURES.md` to document:
  - [ ] 8.1.1 Summary API usage for metrics
  - [ ] 8.1.2 Top-keywords API usage for TopicCloud
  - [ ] 8.1.3 Aspect classification color mapping
  - [ ] 8.1.4 Ranking table structure and logic
- [ ] 8.2 Add code comments explaining three-phase loading strategy
- [ ] 8.3 Document cache TTL settings and rationale (3min/5min/10min)
- [ ] 8.4 Add troubleshooting guide for common issues:
  - [ ] Keywords not showing aspects
  - [ ] Ranking table empty
  - [ ] Project keywords not in top 20

## 9. Performance Validation

- [ ] 9.1 Measure and log phase timings:
  - [ ] 9.1.1 Phase 1: Metrics display (target <500ms with summary)
  - [ ] 9.1.2 Phase 2: TopicCloud display (target <1s with keywords)
  - [ ] 9.1.3 Phase 3: Full dashboard (target <2s with all APIs)
- [ ] 9.2 Compare bandwidth usage: 3-API approach vs posts-only
- [ ] 9.3 Validate cache hit rates for all 3 APIs
- [ ] 9.4 Profile render performance with summary vs calculated metrics
- [ ] 9.5 Measure TopicCloud render time with aspect colors vs without

## 10. Deployment Readiness

- [ ] 10.1 Ensure backward compatibility: dashboard works if new APIs unavailable
- [ ] 10.2 Add feature flags (optional):
  - [ ] 10.2.1 Toggle summary API usage
  - [ ] 10.2.2 Toggle top-keywords API usage
- [ ] 10.3 Verify API endpoints deployed to all environments:
  - [ ] 10.3.1 `/analytic/summary`
  - [ ] 10.3.2 `/analytic/top-keywords`
- [ ] 10.4 Update environment variables if needed
- [ ] 10.5 Ensure project keywords are configured properly for `include_rank_for`
- [ ] 10.6 Review and approve changes with team
- [ ] 10.7 Update API documentation with new endpoints and parameters
