# Implementation Tasks

## 1. API Service Layer

- [x] 1.1 Create `lib/api/services/dashboard.service.ts` with interface definitions for API response
- [x] 1.2 Implement `getDashboardPosts(projectId, params)` method to fetch posts from `/analytic/posts/all`
- [x] 1.3 Add TypeScript interfaces for Post, DashboardApiResponse
- [x] 1.4 Add error handling and timeout configuration
- [ ] 1.5 Write unit tests for dashboard service methods

## 2. Data Transformation Utilities

- [x] 2.1 Create `lib/utils/dashboardDataTransform.ts` for transformation logic
- [x] 2.2 Implement `aggregateMetrics(posts)` to calculate SOV, sentiment, mentions, engagement
- [x] 2.3 Implement `extractTopics(posts)` to aggregate keywords with frequency and sentiment
- [x] 2.4 Implement `extractViralPosts(posts)` to filter and sort by impact_score
- [x] 2.5 Implement `aggregateCompetitors(posts)` to calculate SOV per brand
- [x] 2.6 Implement `buildSalesFunnel(posts)` to create funnel stages based on time periods
- [x] 2.7 Implement `transformToDashboardData(posts)` as main orchestrator
- [ ] 2.8 Write comprehensive unit tests with sample post data
- [ ] 2.9 Validate transformations match existing mock data structure

## 3. Custom Hook with Caching

- [x] 3.1 Create `hooks/useDashboardData.ts` with stale-while-revalidate pattern
- [x] 3.2 Implement cache storage (localStorage or in-memory with TTL)
- [x] 3.3 Implement fetch logic: return cached immediately, fetch fresh in background
- [x] 3.4 Add loading states: `isLoading` (first load), `isRevalidating` (background refresh)
- [x] 3.5 Add error handling with retry mechanism
- [x] 3.6 Add manual refresh capability
- [x] 3.7 Add cache invalidation on project change
- [ ] 3.8 Write integration tests for caching behavior

## 4. Context Integration

- [x] 4.1 Update `contexts/DashboardContext.tsx` to integrate `useDashboardData` hook
- [x] 4.2 Replace mock projects with API-fetched projects (kept existing for compatibility)
- [x] 4.3 Add dashboard data to context state
- [x] 4.4 Add error and loading states to context
- [x] 4.5 Ensure existing context methods still work
- [ ] 4.6 Test context with multiple projects

## 5. Component Updates

- [x] 5.1 Update `components/dashboard/DashboardGrid.tsx` to consume API data from context
- [x] 5.2 Remove hardcoded mock data (lines 52-202)
- [x] 5.3 Update loading state to show skeleton while fetching
- [x] 5.4 Add error state UI with retry button
- [x] 5.5 Update metrics calculation to use real data
- [x] 5.6 Verify all chart components render correctly with real data
- [x] 5.7 Add refresh indicator for background revalidation

## 6. Error Handling & Edge Cases

- [x] 6.1 Handle empty posts array (no data for project)
- [x] 6.2 Handle API errors (network, 4xx, 5xx)
- [x] 6.3 Handle malformed API responses
- [x] 6.4 Handle missing or null fields in posts
- [x] 6.5 Add user-friendly error messages
- [x] 6.6 Add retry logic with exponential backoff
- [x] 6.7 Add fallback to cached data on error

## 7. Testing & Validation

- [ ] 7.1 Test with real API endpoint and sample project
- [ ] 7.2 Verify all charts render with correct data
- [ ] 7.3 Verify metrics calculations are accurate
- [ ] 7.4 Test cache behavior (initial load, revisit, refresh)
- [ ] 7.5 Test error scenarios (API down, network error, timeout)
- [ ] 7.6 Test with different project sizes (small, medium, large datasets)
- [ ] 7.7 Performance test: measure load time with 1000+ posts
- [ ] 7.8 Cross-browser testing (Chrome, Firefox, Safari)

## 8. Documentation & Cleanup

- [ ] 8.1 Document API service methods with JSDoc
- [ ] 8.2 Document transformation utilities with examples
- [ ] 8.3 Update CHART_OVERVIEW.md with actual data sources
- [ ] 8.4 Add inline comments for complex transformation logic
- [ ] 8.5 Remove unused mock data constants
- [ ] 8.6 Update type definitions if needed

## Notes

- Keep transformation logic pure and testable
- Maintain backward compatibility with existing component interfaces
- Prioritize performance: memoize expensive calculations
- Consider adding analytics tracking for API errors
- Future enhancement: WebSocket for real-time updates (out of scope for this change)
