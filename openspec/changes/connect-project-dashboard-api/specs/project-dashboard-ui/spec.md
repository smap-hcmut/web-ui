# project-dashboard-ui Specification Delta

## MODIFIED Requirements

### Requirement: Dashboard Data Source

The dashboard UI SHALL consume real API data instead of hardcoded mock data:
- Remove hardcoded mock data from `DashboardGrid.tsx` (lines 52-202)
- Fetch data via `useDashboardData` hook from API service
- Display loading states during data fetch
- Display error states when API fails
- Support manual refresh of dashboard data

#### Scenario: Initial dashboard load

**GIVEN** user navigates to `/projects/{project_id}/dashboard`
**WHEN** the DashboardGrid component mounts
**THEN** shows loading skeleton for metrics and charts
**AND** fetches dashboard data via API
**AND** renders real data when fetch completes
**AND** all charts display data from API response

#### Scenario: Dashboard with cached data

**GIVEN** user previously visited dashboard and data is cached
**WHEN** user navigates back to dashboard
**THEN** immediately shows cached data (no skeleton)
**AND** displays subtle revalidation indicator
**AND** updates UI smoothly when fresh data arrives

#### Scenario: Dashboard load failure

**GIVEN** API request fails due to network or server error
**WHEN** DashboardGrid attempts to load
**THEN** shows error state with friendly message
**AND** provides retry button
**AND** uses cached data if available with warning banner

---

### Requirement: Real-Time Data Context

The DashboardContext SHALL integrate with API service for data management:
- Replace mock projects array with API-fetched projects
- Store dashboard data (metrics, topics, viral posts) in context state
- Provide loading and error states
- Support data refresh mechanism

#### Scenario: Context provides API data

**GIVEN** DashboardContext is initialized with project ID
**WHEN** child components consume context via `useDashboard()`
**THEN** components receive real dashboard data from API
**AND** loading state reflects API fetch status
**AND** error state reflects API errors

#### Scenario: Multiple components share context data

**GIVEN** DashboardGrid, MetricCard, and chart components use same context
**WHEN** API data is fetched once
**THEN** all components receive same data without duplicate API calls
**AND** data remains consistent across all components

---

## ADDED Requirements

### Requirement: Loading States

The dashboard SHALL display appropriate loading indicators:
- Skeleton loading for initial load
- Subtle revalidation indicator for background refresh
- Spinner for manual refresh

#### Scenario: First load skeleton

**GIVEN** dashboard is loading for first time
**WHEN** waiting for API response
**THEN** shows skeleton placeholders for:
**AND** 4 metric cards with animated pulse
**AND** chart containers with pulse animation
**AND** no actual data is displayed

#### Scenario: Background revalidation indicator

**GIVEN** cached data is displayed
**WHEN** background revalidation is in progress
**THEN** shows small icon/badge indicating "Updating..."
**AND** does not block UI or show full loading state
**AND** indicator disappears when revalidation completes

---

### Requirement: Error States

The dashboard SHALL display user-friendly error messages:
- Network error: "Unable to connect. Please check your internet connection."
- Server error: "Server error. Please try again later."
- Timeout: "Request timed out. Please try again."
- Empty data: "No data available for this project yet."

#### Scenario: Network error display

**GIVEN** API request fails with network error
**WHEN** error state is rendered
**THEN** shows error icon and message
**AND** provides "Retry" button
**AND** optionally shows cached data with warning

#### Scenario: Empty project data

**GIVEN** project has no analyzed posts (new project)
**WHEN** API returns empty data array
**THEN** shows empty state message
**AND** suggests user to run analysis or wait for data
**AND** does not show error (this is valid state)

---

### Requirement: Manual Refresh

The dashboard SHALL support manual data refresh:
- Refresh button in dashboard header
- Bypass cache and fetch fresh data
- Show loading indicator during refresh

#### Scenario: User triggers manual refresh

**GIVEN** user is viewing dashboard with cached data
**WHEN** user clicks refresh button
**THEN** shows loading indicator
**AND** fetches fresh data from API (bypass cache)
**AND** updates all charts and metrics with new data
**AND** hides loading indicator when complete

#### Scenario: Refresh during ongoing fetch

**GIVEN** dashboard is already fetching data
**WHEN** user clicks refresh button
**THEN** refresh button is disabled
**AND** message shows "Already updating..."
**AND** does not trigger duplicate API call

---

### Requirement: Data Transformation Display

The dashboard charts SHALL correctly render transformed API data:
- MetricCards display aggregated metrics (SOV, sentiment, mentions, engagement)
- UnifiedChart displays time-series trends from posts
- TopicCloud displays keyword frequency and sentiment
- CompetitorChart displays SOV per brand
- TopViralPosts displays high-impact posts
- SalesFunnel displays time-based funnel stages

#### Scenario: Metrics display real aggregated data

**GIVEN** API returns 500 posts
**WHEN** metrics are calculated and displayed
**THEN** SOV shows correct percentage based on brand mentions
**AND** Sentiment shows weighted average sentiment
**AND** Mentions shows total count of posts (500)
**AND** Engagement shows average engagement rate from all posts

#### Scenario: Topics cloud reflects API keywords

**GIVEN** API posts contain various keywords
**WHEN** TopicCloud is rendered
**THEN** displays words sized by frequency
**AND** colored by sentiment (green=positive, red=negative)
**AND** clicking topic filters dashboard by that keyword

#### Scenario: Viral posts show high-impact content

**GIVEN** API returns posts with impact scores
**WHEN** TopViralPosts component renders
**THEN** displays top 8 posts sorted by impact_score
**AND** shows risk level badges (LOW, MEDIUM, HIGH, CRITICAL)
**AND** displays engagement metrics and timestamps

---

### Requirement: Performance Optimization

The dashboard SHALL optimize performance for large datasets:
- Memoize expensive calculations
- Debounce rapid re-renders
- Lazy load chart components if needed
- Limit data to reasonable thresholds (e.g., top 1000 posts)

#### Scenario: Large dataset rendering

**GIVEN** API returns 1000 posts
**WHEN** dashboard transforms and renders data
**THEN** page remains responsive (no freezing)
**AND** initial render completes within 2 seconds
**AND** charts update smoothly without lag

#### Scenario: Memoized transformations

**GIVEN** dashboard data is fetched and transformed
**WHEN** user changes time range filter (UI-only filter)
**THEN** raw data transformation is not re-run
**AND** only filtered subset is recalculated
**AND** UI updates instantly
