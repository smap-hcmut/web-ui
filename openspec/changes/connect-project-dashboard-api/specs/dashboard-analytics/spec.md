# dashboard-analytics Specification Delta

## ADDED Requirements

### Requirement: Dashboard Posts API Integration

The system SHALL provide an API service to fetch analyzed posts data for dashboard visualization:
- Endpoint: `GET /analytic/posts/all`
- Query parameters: `project_id` (required), `limit` (default 1000), `sort_by`, `sort_order`
- Response format: JSON with `success` boolean and `data` array of Post objects
- Authentication: Uses HttpOnly cookie credentials

#### Scenario: Fetch posts for specific project

**GIVEN** a user is viewing dashboard for project ID "abc123"
**WHEN** the dashboard service calls `getDashboardPosts("abc123")`
**THEN** the system sends GET request to `/analytic/posts/all?project_id=abc123&limit=1000&sort_by=analyzed_at&sort_order=desc`
**AND** returns array of Post objects with all required fields

#### Scenario: Handle API error gracefully

**GIVEN** the API endpoint is unavailable
**WHEN** the dashboard service attempts to fetch posts
**THEN** the system returns an error object with status code and message
**AND** does not crash the application

#### Scenario: Handle empty project data

**GIVEN** a project has no analyzed posts yet
**WHEN** the dashboard service fetches posts
**THEN** the API returns `data: []` empty array
**AND** the system handles this as valid response (not error)

---

### Requirement: Post Data Structure

The system SHALL support a Post data structure from API containing:
- `id`: Unique identifier
- `platform`: Social media platform (TIKTOK, YOUTUBE, INSTAGRAM, etc.)
- `permalink`: URL to original post
- `content_text`: Post content
- `author_name`, `author_username`, `author_is_verified`: Author metadata
- `overall_sentiment`: Sentiment label (POSITIVE, NEGATIVE, NEUTRAL)
- `overall_sentiment_score`: Numeric sentiment score
- `primary_intent`: Intent classification (DISCUSSION, PURCHASE, etc.)
- `impact_score`: Virality impact (0-1)
- `risk_level`: Risk assessment (LOW, MEDIUM, HIGH, CRITICAL)
- `is_viral`, `is_kol`: Boolean flags
- `view_count`, `like_count`, `comment_count`: Engagement metrics
- `published_at`, `analyzed_at`: Timestamps
- `brand_name`, `keyword`, `job_id`: Context metadata

#### Scenario: Parse complete post object

**GIVEN** the API returns a post with all fields populated
**WHEN** the service parses the response
**THEN** all fields are correctly typed and accessible
**AND** no fields are missing or undefined

#### Scenario: Handle optional or missing fields

**GIVEN** a post object with some null/missing fields (e.g., `author_is_verified` is null)
**WHEN** transformation utilities process the post
**THEN** the system uses safe defaults or skips calculations dependent on missing data
**AND** does not throw errors

---

### Requirement: Metrics Aggregation

The system SHALL aggregate raw posts data into dashboard metrics:
- **SOV (Share of Voice)**: Percentage of mentions per brand relative to total mentions
- **Sentiment Score**: Average sentiment weighted by engagement
- **Total Mentions**: Count of all posts in dataset
- **Engagement Rate**: Average engagement ratio (likes + comments) / views

#### Scenario: Calculate Share of Voice

**GIVEN** 100 posts with `brand_name`: "BrandA" (40 posts), "BrandB" (35 posts), "BrandC" (25 posts)
**WHEN** the system calculates SOV
**THEN** BrandA has SOV = 40%, BrandB = 35%, BrandC = 25%

#### Scenario: Calculate weighted sentiment

**GIVEN** posts with varying sentiment scores and engagement
**WHEN** the system calculates overall sentiment
**THEN** high-engagement posts have more weight in final sentiment score
**AND** the result is normalized to range -1 to +1

#### Scenario: Handle zero engagement posts

**GIVEN** posts with zero views (or missing view count)
**WHEN** calculating engagement rate
**THEN** the system skips these posts or treats as 0% engagement
**AND** does not divide by zero

---

### Requirement: Topics Extraction

The system SHALL extract trending topics from posts:
- Aggregate by `keyword` field across all posts
- Calculate frequency (value), sentiment, and trend
- Include mention count and engagement metrics per topic

#### Scenario: Extract topics from keywords

**GIVEN** 100 posts with `keyword` values: "coffee" (30x), "quality" (25x), "price" (20x), etc.
**WHEN** the system extracts topics
**THEN** returns topic array sorted by frequency
**AND** each topic includes `text`, `value`, `sentiment`, `mentions`, `engagement`

#### Scenario: Calculate topic sentiment

**GIVEN** keyword "coffee" appears in 30 posts with mixed sentiments
**WHEN** the system calculates topic sentiment
**THEN** average sentiment is computed from all posts mentioning that keyword
**AND** weighted by engagement if posts have different impact

#### Scenario: Determine topic trend

**GIVEN** historical data showing keyword frequency over time
**WHEN** the system determines trend
**THEN** returns "rising" if frequency increasing, "falling" if decreasing, "stable" otherwise
**AND** trend is based on comparison with previous time period

---

### Requirement: Viral Posts Identification

The system SHALL identify viral posts based on impact score:
- Filter posts with `impact_score > 0.5` OR `is_viral = true`
- Sort by `impact_score` descending
- Include risk level, engagement, and reach metrics

#### Scenario: Filter viral posts

**GIVEN** 1000 posts with varying impact scores
**WHEN** the system filters viral posts
**THEN** returns only posts with `impact_score > 0.5` or `is_viral = true`
**AND** sorted by impact_score (highest first)
**AND** limited to top 10 viral posts

#### Scenario: Map risk levels correctly

**GIVEN** a viral post with `risk_level = "HIGH"`
**WHEN** the post is displayed in TopViralPosts component
**THEN** the risk badge shows correct color (orange for HIGH, red for CRITICAL)
**AND** impact score is displayed as percentage (0-100)

---

### Requirement: Stale-While-Revalidate Caching

The system SHALL implement caching strategy for dashboard data:
- Cache fetched data in memory or localStorage with TTL (time-to-live)
- Return cached data immediately on subsequent requests
- Fetch fresh data in background and update cache
- Show revalidation indicator when background fetch is in progress

#### Scenario: First load without cache

**GIVEN** user visits dashboard for first time (no cached data)
**WHEN** the useDashboardData hook is called
**THEN** shows loading state while fetching
**AND** fetches data from API
**AND** stores result in cache with timestamp
**AND** updates UI with fetched data

#### Scenario: Subsequent load with valid cache

**GIVEN** cached dashboard data exists and is less than 5 minutes old
**WHEN** user revisits dashboard
**THEN** immediately returns cached data (no loading state)
**AND** triggers background revalidation
**AND** shows subtle revalidation indicator
**AND** updates UI silently when fresh data arrives

#### Scenario: Expired cache

**GIVEN** cached data is older than TTL (e.g., 10 minutes)
**WHEN** user revisits dashboard
**THEN** treats as first load (shows loading state)
**AND** fetches fresh data from API
**AND** updates cache with new timestamp

#### Scenario: Manual refresh

**GIVEN** user clicks refresh button
**WHEN** refresh is triggered
**THEN** bypasses cache and shows loading state
**AND** fetches fresh data from API
**AND** updates cache and UI

#### Scenario: Project change invalidates cache

**GIVEN** user switches to different project
**WHEN** new project ID is selected
**THEN** clears cache for previous project
**AND** fetches data for new project
**AND** shows loading state

---

### Requirement: Error Handling and Fallback

The system SHALL handle API errors gracefully:
- Network errors: Show error message with retry button
- API errors (4xx, 5xx): Show specific error message
- Timeout: Show timeout message with retry option
- Fallback: Use cached data if available, otherwise show empty state

#### Scenario: Network error with cached data

**GIVEN** cached data exists from previous successful fetch
**WHEN** API request fails due to network error
**THEN** continues showing cached data
**AND** displays warning banner "Using cached data. Failed to fetch latest updates."
**AND** provides retry button

#### Scenario: Network error without cache

**GIVEN** no cached data available (first load)
**WHEN** API request fails
**THEN** shows error state with message and retry button
**AND** does not crash or show blank page

#### Scenario: API timeout

**GIVEN** API takes longer than 10 seconds to respond
**WHEN** request times out
**THEN** shows timeout error message
**AND** offers retry with increased timeout

#### Scenario: Malformed API response

**GIVEN** API returns response with unexpected structure
**WHEN** parsing the response
**THEN** catches parsing error
**AND** shows error message "Unable to process server response"
**AND** logs error details for debugging
