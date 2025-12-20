# dashboard-analytics Specification Delta

## ADDED Requirements

### Requirement: Dashboard Summary API Integration

The system SHALL provide an API service to fetch aggregated dashboard metrics from the summary endpoint:
- Endpoint: `GET /analytic/summary`
- Query parameters: `project_id` (required)
- Response format: JSON with `success` boolean and `data` object containing aggregated metrics
- Authentication: Uses HttpOnly cookie credentials
- Summary data includes: total posts, sentiment distribution, engagement totals, risk distribution, platform distribution, viral/KOL counts

#### Scenario: Fetch summary for specific project

**GIVEN** a user is viewing dashboard for project ID "abc123"
**WHEN** the dashboard service calls `getDashboardSummary("abc123")`
**THEN** the system sends GET request to `/analytic/summary?project_id=abc123`
**AND** returns summary object with all aggregated metrics
**AND** response time is under 500ms (faster than posts/all)

#### Scenario: Handle summary API error gracefully

**GIVEN** the summary API endpoint is unavailable
**WHEN** the dashboard service attempts to fetch summary
**THEN** the system falls back to calculating metrics from posts data
**AND** logs the error for monitoring
**AND** does not crash the application

#### Scenario: Parse summary response correctly

**GIVEN** the API returns valid summary data
**WHEN** the service parses the response
**THEN** all fields are correctly typed and accessible
**AND** numeric values are properly parsed (totals, averages, distributions)

---

### Requirement: Summary Data Structure

The system SHALL support a DashboardSummary data structure from API containing:
- `total_posts`: Total number of analyzed posts
- `total_comments`: Total comments across all posts
- `sentiment_distribution`: Object with POSITIVE/NEUTRAL/NEGATIVE counts
- `avg_sentiment_score`: Average sentiment score (0-1)
- `risk_distribution`: Object with LOW/MEDIUM/HIGH/CRITICAL counts
- `intent_distribution`: Object with intent type counts (DISCUSSION/SEEDING/LEAD/SUPPORT)
- `platform_distribution`: Object with platform counts (TIKTOK/YOUTUBE/etc.)
- `engagement_totals`: Object with views/likes/comments/shares/saves totals
- `viral_count`: Number of viral posts
- `kol_count`: Number of posts by KOLs
- `avg_impact_score`: Average impact score across all posts

#### Scenario: Parse complete summary object

**GIVEN** the API returns summary with all fields populated
**WHEN** the service parses the response
**THEN** all fields are correctly typed and accessible
**AND** no fields are missing or undefined
**AND** distribution objects contain valid keys and numeric values

#### Scenario: Handle partial summary data

**GIVEN** a summary object with some missing optional fields
**WHEN** transformation utilities process the summary
**THEN** the system uses safe defaults for missing fields
**AND** does not throw errors

---

### Requirement: Top Keywords API Integration

The system SHALL provide an API service to fetch top trending keywords with aspect classification and project keyword rankings:
- Endpoint: `GET /analytic/top-keywords`
- Query parameters: `project_id` (required), `limit` (optional, default 20), `include_rank_for` (optional, comma-separated project keywords)
- Response format: JSON with `success` boolean and `data` object containing `keywords` array and `input_keyword_ranks` array
- Authentication: Uses HttpOnly cookie credentials
- Keywords include: keyword text, count, sentiment score, aspect classification, sentiment breakdown

#### Scenario: Fetch top keywords for project

**GIVEN** a user is viewing dashboard for project ID "abc123" with keywords ["kiro", "xe"]
**WHEN** the dashboard service calls `getTopKeywords("abc123", { limit: 20, includeRankFor: ["kiro", "xe"] })`
**THEN** the system sends GET request to `/analytic/top-keywords?project_id=abc123&limit=20&include_rank_for=kiro,xe`
**AND** returns top 20 keywords with counts and aspects
**AND** returns ranking info for "kiro" and "xe" in `input_keyword_ranks`
**AND** response time is under 1 second

#### Scenario: Handle top-keywords API error gracefully

**GIVEN** the top-keywords API endpoint is unavailable
**WHEN** the dashboard service attempts to fetch keywords
**THEN** the system falls back to calculating keywords from posts data
**AND** logs the error for monitoring
**AND** displays TopicCloud using fallback data

#### Scenario: Fetch without project keywords

**GIVEN** project has no configured keywords
**WHEN** the dashboard fetches top keywords
**THEN** the system omits `include_rank_for` parameter
**AND** returns only top 20 trending keywords
**AND** `input_keyword_ranks` array is empty

---

### Requirement: Top Keywords Data Structure

The system SHALL support a TopKeywordsResponse data structure from API containing:
- `keywords`: Array of keyword objects with:
  - `keyword`: String keyword text
  - `count`: Number of mentions
  - `avg_sentiment_score`: Average sentiment (0-1)
  - `aspect`: Classification (PRICE/PERFORMANCE/DESIGN/SERVICE/null)
  - `sentiment_breakdown`: Object with POSITIVE/NEUTRAL/NEGATIVE counts
- `input_keyword_ranks`: Array of project keyword rank objects with:
  - `keyword`: Project keyword text
  - `rank`: Rank position (1-based, null if not in top)
  - `count`: Mention count
  - `avg_sentiment_score`: Average sentiment
  - `in_top`: Boolean indicating if in top 20
  - `aspect`: Classification

#### Scenario: Parse complete top-keywords response

**GIVEN** the API returns top keywords with all fields populated
**WHEN** the service parses the response
**THEN** all keyword objects have valid keyword, count, and sentiment fields
**AND** aspect values are one of PRICE/PERFORMANCE/DESIGN/SERVICE or null
**AND** sentiment_breakdown contains numeric values
**AND** input_keyword_ranks contains ranking info for requested keywords

#### Scenario: Handle missing aspect classification

**GIVEN** a keyword with null or missing aspect field
**WHEN** the UI displays the keyword
**THEN** the system uses default color (gray)
**AND** displays aspect as "GENERAL" or "Uncategorized"
**AND** does not throw errors

---

### Requirement: TopicCloud Aspect-Based Visualization

The system SHALL visualize keywords in TopicCloud with color coding based on aspect classification:
- **PRICE** keywords: Orange (#f59e0b) - keywords about pricing, cost
- **PERFORMANCE** keywords: Blue (#3b82f6) - keywords about performance, speed
- **DESIGN** keywords: Purple (#8b5cf6) - keywords about design, aesthetics
- **SERVICE** keywords: Green (#10b981) - keywords about service, support
- **Uncategorized**: Gray (#6b7280) - keywords without aspect

#### Scenario: Display keyword with aspect color

**GIVEN** keyword "tiền" with aspect "PRICE"
**WHEN** the TopicCloud renders
**THEN** the keyword is displayed in orange color (#f59e0b)
**AND** tooltip shows "tiền - PRICE aspect"
**AND** font size scales with count value

#### Scenario: Mix of different aspects in cloud

**GIVEN** keywords with aspects: "tiền" (PRICE), "lag" (PERFORMANCE), "màu" (DESIGN), "hỗ trợ" (SERVICE)
**WHEN** the TopicCloud renders
**THEN** each keyword displays in its respective aspect color
**AND** user can visually distinguish categories
**AND** color legend shows aspect meanings

---

### Requirement: Project Keywords Ranking Display

The system SHALL display project keywords with their rankings in a table below the word cloud:
- **Top 5 keywords** (rank < 5): Displayed at top section with "Top 5" badge and gold/accent color
- **Other keywords** (rank >= 5): Displayed in bottom section with normal styling
- **Not in top 20**: Displayed with rank "20+" and gray color
- Each row shows: rank, keyword, aspect, sentiment bar

#### Scenario: Display top 5 project keyword

**GIVEN** project keyword "tiền" has rank 1
**WHEN** the ranking table renders
**THEN** "tiền" appears in "TOP 5 KEYWORDS" section
**AND** displays with gold/accent background color
**AND** shows "Top 5" badge
**AND** shows rank "#1"
**AND** displays sentiment breakdown bar

#### Scenario: Display project keyword outside top 5

**GIVEN** project keyword "kiro" has rank 8
**WHEN** the ranking table renders
**THEN** "kiro" appears in "OTHER KEYWORDS" section
**AND** displays with normal styling (no badge)
**AND** shows rank "#8"
**AND** displays sentiment breakdown bar

#### Scenario: Display project keyword not in top 20

**GIVEN** project keyword "xe hơi" has rank null and in_top=false
**WHEN** the ranking table renders
**THEN** "xe hơi" appears in "OTHER KEYWORDS" section
**AND** displays with gray color
**AND** shows rank "20+"
**AND** displays sentiment as "Low mentions"

---

### Requirement: Optimized Data Fetching Strategy

The system SHALL implement a three-phase data loading strategy:
- **Phase 1 (Priority - <500ms)**: Fetch summary API immediately for metrics cards
- **Phase 2 (Fast - <1s)**: Fetch top-keywords API for TopicCloud
- **Phase 3 (Background - 2-5s)**: Fetch posts API for detailed charts (viral posts, time-series)
- Summary data is used for metrics cards and overview stats
- Top-keywords data is used for TopicCloud with rankings
- Posts data is used for ViralPosts and time-series charts
- Each API has independent cache with appropriate TTL

#### Scenario: Initial dashboard load with three phases

**GIVEN** user visits dashboard for first time (no cache)
**WHEN** the dashboard loads
**THEN** the system fetches summary API first (Phase 1)
**AND** displays metrics cards immediately when summary loads (<500ms)
**AND** triggers top-keywords API fetch (Phase 2)
**AND** displays TopicCloud when keywords load (<1s)
**AND** triggers background fetch for posts API (Phase 3)
**AND** updates viral posts and time-series charts when posts load (2-5s)
**AND** shows loading states for each phase independently

#### Scenario: Fast initial render with cached data

**GIVEN** user returns to dashboard with valid caches for all 3 APIs
**WHEN** the dashboard loads
**THEN** the system displays cached summary metrics instantly (<100ms)
**AND** displays cached TopicCloud instantly
**AND** triggers background revalidation for all 3 APIs
**AND** updates UI silently when fresh data arrives

#### Scenario: Top-keywords API fails but posts API succeeds

**GIVEN** top-keywords API request fails
**WHEN** dashboard attempts to load TopicCloud
**THEN** the system waits for posts API
**AND** calculates keywords from posts data using existing transformation
**AND** displays TopicCloud using fallback data (without aspect classification)
**AND** logs error for monitoring

---

### Requirement: Summary-Based Metrics Calculation

The system SHALL use summary API data for calculating dashboard metrics when available:
- **Total Mentions**: Use `total_posts` from summary
- **Sentiment Score**: Use `avg_sentiment_score` from summary
- **Engagement Rate**: Calculate from `engagement_totals` (likes + comments) / views
- **Platform Distribution**: Use `platform_distribution` from summary
- **Risk Breakdown**: Use `risk_distribution` from summary

#### Scenario: Calculate engagement rate from summary

**GIVEN** summary contains `engagement_totals` with views=24780501, likes=1729425, comments=8439480
**WHEN** the system calculates overall engagement rate
**THEN** engagement_rate = (likes + comments) / views = (1729425 + 8439480) / 24780501 = 0.41 (41%)

#### Scenario: Display sentiment distribution from summary

**GIVEN** summary contains `sentiment_distribution` with POSITIVE=59, NEUTRAL=7, NEGATIVE=4
**WHEN** the system displays sentiment breakdown
**THEN** calculates percentages: Positive=84.3%, Neutral=10%, Negative=5.7%
**AND** displays in sentiment chart/cards correctly

#### Scenario: Fallback to posts calculation when summary unavailable

**GIVEN** summary API fails or returns empty data
**WHEN** the system needs to display metrics
**THEN** falls back to aggregating metrics from posts array
**AND** uses existing `aggregateMetrics()` function
**AND** metrics values match what summary API would return

---

### Requirement: Independent Caching for Summary, Top-Keywords and Posts

The system SHALL implement separate caching strategies for all three data sources:
- Summary cache: TTL 3 minutes (shortest, metrics change frequently)
- Top-keywords cache: TTL 5 minutes (medium, keyword rankings change moderately)
- Posts cache: TTL 10 minutes (longest, larger dataset, slower to fetch)
- Cache keys prefixed with `project_id` for isolation
- All caches invalidated on manual refresh or project change
- Stale-while-revalidate strategy for all three

#### Scenario: Cache with different TTLs

**GIVEN** user loads dashboard and all 3 APIs are fetched at 10:00
**WHEN** user revisits at 10:06
**THEN** summary cache is expired (TTL 3min)
**AND** top-keywords cache is expired (TTL 5min)
**AND** posts cache is still valid (TTL 10min)
**AND** system refetches summary and top-keywords but uses cached posts
**AND** displays mixed cached/fresh data clearly

#### Scenario: Manual refresh invalidates all caches

**GIVEN** user has cached summary, top-keywords and posts data
**WHEN** user clicks refresh button
**THEN** all 3 caches are cleared
**AND** all 3 APIs are refetched
**AND** loading states shown for all three phases

#### Scenario: Project change invalidates all caches

**GIVEN** user switches from project A to project B
**WHEN** new project dashboard loads
**THEN** all caches for project A are retained (for fast back navigation)
**AND** new caches created for project B with keys `dashboard:summary:projectB`, `dashboard:keywords:projectB`, `dashboard:posts:projectB`
**AND** all 3 APIs fetched for project B

---

### Requirement: Graceful Degradation and Error Handling

The system SHALL handle API failures gracefully with fallback strategies:
- If summary fails: Calculate from posts
- If top-keywords fails: Calculate from posts (without aspect classification)
- If posts fail but summary+keywords succeed: Show metrics and TopicCloud, hide viral/time-series charts
- If all 3 fail: Show error state with retry, or use cached data
- Network errors: Use cached data if available

#### Scenario: Summary fails but others succeed

**GIVEN** summary API returns 500 error
**WHEN** dashboard loads
**THEN** the system fetches posts API
**AND** calculates summary metrics from posts data
**AND** displays metrics cards (slower but functional)
**AND** displays TopicCloud from top-keywords API
**AND** logs error for monitoring

#### Scenario: Top-keywords fails but others succeed

**GIVEN** top-keywords API returns 500 error or times out
**WHEN** dashboard loads TopicCloud
**THEN** the system displays summary metrics correctly
**AND** falls back to calculating keywords from posts data
**AND** displays TopicCloud without aspect colors (uses legacy transformation)
**AND** shows warning "Keyword aspects unavailable"
**AND** logs error for monitoring

#### Scenario: Posts fails but summary and keywords succeed

**GIVEN** posts API returns 500 error or times out
**WHEN** dashboard loads
**THEN** the system displays summary-based metrics cards correctly
**AND** displays TopicCloud from top-keywords API with ranking table
**AND** shows error state for ViralPosts and time-series charts
**AND** displays message "Some detailed charts unavailable. Showing overview data."
**AND** provides retry button for posts API only

#### Scenario: All 3 APIs fail with no cache

**GIVEN** all summary, top-keywords and posts APIs fail
**WHEN** dashboard loads for first time (no cache)
**THEN** the system shows error state
**AND** displays message "Unable to load dashboard data. Please check your connection."
**AND** provides retry button
**AND** does not crash or show blank page

#### Scenario: All 3 APIs fail with valid cache

**GIVEN** all summary, top-keywords and posts APIs fail
**WHEN** dashboard loads with valid cached data
**THEN** the system displays all cached data (metrics, TopicCloud, charts)
**AND** shows warning banner "Using cached data. Unable to fetch latest updates."
**AND** provides retry button
**AND** displays last update timestamp for each data source

---

## MODIFIED Requirements

### Requirement: Dashboard Posts API Integration

The system SHALL provide an API service to fetch analyzed posts data for dashboard visualization:
- Endpoint: `GET /analytic/posts/all`
- Query parameters: `project_id` (required), `limit` (default 1000), `sort_by`, `sort_order`
- Response format: JSON with `success` boolean and `data` array of Post objects
- Authentication: Uses HttpOnly cookie credentials
- **MODIFIED**: Posts API is now fetched in Phase 3 (background) after summary and top-keywords APIs
- **MODIFIED**: Used primarily for ViralPosts and time-series charts, NOT for metrics or TopicCloud
- **MODIFIED**: TopicCloud now uses top-keywords API instead of posts aggregation

#### Scenario: Fetch posts for specific project

**GIVEN** a user is viewing dashboard for project ID "abc123"
**WHEN** the dashboard service calls `getDashboardPosts("abc123")`
**THEN** the system sends GET request to `/analytic/posts/all?project_id=abc123&limit=1000&sort_by=analyzed_at&sort_order=desc`
**AND** returns array of Post objects with all required fields
**AND** this fetch happens in background (not blocking metrics display)

#### Scenario: Handle API error gracefully

**GIVEN** the API endpoint is unavailable
**WHEN** the dashboard service attempts to fetch posts
**THEN** the system returns an error object with status code and message
**AND** does not crash the application
**AND** metrics cards still display using summary API data

#### Scenario: Handle empty project data

**GIVEN** a project has no analyzed posts yet
**WHEN** the dashboard service fetches posts
**THEN** the API returns `data: []` empty array
**AND** the system handles this as valid response (not error)
**AND** summary API also returns zeros/empty distributions
