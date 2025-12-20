# Design: Dashboard Summary API Integration

## Context

The dashboard currently fetches all posts via `/analytic/posts/all` (returning ~70-1000+ posts) and performs aggregation in the frontend to calculate metrics like total mentions, sentiment distribution, engagement totals, etc. This approach:
- Requires large API payload (~500KB - 5MB depending on post count)
- Takes 2-5 seconds for initial load
- Performs redundant calculations that backend already has

Backend has deployed `/analytic/summary` API that returns pre-aggregated metrics (~5KB response, <500ms). This design doc outlines how to integrate summary API while maintaining backward compatibility and detailed chart functionality.

## Goals / Non-Goals

### Goals
- **Fast initial render**: Display metrics cards in <500ms using summary API
- **Reduced bandwidth**: Fetch summary (5KB) instead of all posts (500KB+) for initial view
- **Progressive enhancement**: Load detailed charts in background using posts API
- **Backward compatibility**: Gracefully fallback if summary API unavailable
- **Independent caching**: Cache summary and posts separately with appropriate TTLs

### Non-Goals
- **Not replacing posts API**: Still need posts for TopicCloud, ViralPosts, time-series
- **Not modifying backend**: Work with existing API responses, suggest improvements separately
- **Not removing frontend calculations**: Keep as fallback when summary unavailable
- **Not breaking existing components**: Maintain current component interfaces

## Decisions

### Decision 1: Two-Phase Loading Strategy

**What**: Fetch summary API first, then posts API in background

**Why**:
- Summary API is fast (<500ms) and small (~5KB)
- Metrics cards are most important for initial user experience
- Detailed charts (topics, viral posts) can load progressively
- Users get instant feedback instead of waiting 2-5s for everything

**Alternatives considered**:
- **Fetch only summary, skip posts**: Would break detailed charts (TopicCloud, ViralPosts)
- **Fetch both in parallel**: Slower initial render, no bandwidth savings
- **Fetch posts first, ignore summary**: Current behavior, no improvement

**Implementation**:
```typescript
// Phase 1: Fetch summary immediately
const summary = await getDashboardSummary(projectId) // 500ms, 5KB

// Display metrics cards now ✅

// Phase 2: Fetch posts in background
const posts = await getDashboardPosts(projectId) // 2s, 500KB

// Update detailed charts when ready ✅
```

---

### Decision 2: Independent Caching with Different TTLs

**What**:
- Summary cache: TTL 3 minutes
- Posts cache: TTL 10 minutes

**Why**:
- Summary data changes more frequently (new posts analyzed)
- Posts data is larger, more expensive to fetch, slower to change
- Allows summary to refresh while using stale posts cache
- Users get fresh metrics without re-downloading entire posts dataset

**Alternatives considered**:
- **Same TTL for both**: Wastes bandwidth refreshing posts when only metrics changed
- **No cache for summary**: Fast enough to skip cache - but network failures would hurt UX
- **Longer TTL for summary**: Metrics would be stale, defeats purpose of fast updates

**Implementation**:
```typescript
const CACHE_KEYS = {
  summary: (projectId: string) => `dashboard:summary:${projectId}`,
  posts: (projectId: string) => `dashboard:posts:${projectId}`,
}

const CACHE_TTL = {
  summary: 3 * 60 * 1000, // 3 minutes
  posts: 10 * 60 * 1000,   // 10 minutes
}
```

---

### Decision 3: Fallback Hierarchy for Error Handling

**What**: Define clear fallback strategy for each API failure scenario

**Why**:
- Ensures dashboard always displays something useful
- Handles network issues, backend errors, partial deployments
- Maintains user trust with graceful degradation

**Fallback Logic**:

| Summary API | Posts API | Result |
|-------------|-----------|--------|
| ✅ Success  | ✅ Success | Best: Show all metrics + detailed charts |
| ✅ Success  | ❌ Failed  | Show metrics, hide/error for detailed charts |
| ❌ Failed   | ✅ Success | Calculate metrics from posts, show everything |
| ❌ Failed   | ❌ Failed  | Use cache if available, otherwise show error |

**Alternatives considered**:
- **Fail hard on any error**: Bad UX, dashboard completely broken
- **Always calculate from posts**: Doesn't leverage summary API benefits
- **Show partial data without indication**: Confusing for users

**Implementation**:
```typescript
try {
  summary = await getDashboardSummary(projectId)
} catch (error) {
  console.error('Summary API failed, will calculate from posts')
  summary = null
}

try {
  posts = await getDashboardPosts(projectId)
} catch (error) {
  if (!summary) {
    // Both failed, try cache or show error
    return handleBothFailed()
  }
  // Summary succeeded, show metrics only
  return { summary, posts: null, hasDetailedCharts: false }
}

// Use summary if available, otherwise calculate
const metrics = summary || aggregateMetrics(posts)
```

---

### Decision 4: Metrics Calculation Priority

**What**: Use summary data for metrics when available, fallback to posts calculation

**Why**:
- Backend calculations are authoritative source of truth
- Ensures consistency across dashboard and other views
- Faster (no client-side aggregation needed)
- Reduces CPU usage on client

**Alternatives considered**:
- **Always calculate from posts**: Defeats purpose, inconsistent with backend
- **Only use summary, no fallback**: Breaks dashboard if API unavailable
- **Compare both and show warning if different**: Adds complexity, confusing for users

**Implementation**:
```typescript
export function getMetrics(
  summary: DashboardSummary | null,
  posts: DashboardPost[]
): DashboardMetrics {
  if (summary) {
    // Prefer summary data
    return {
      totalMentions: summary.total_posts,
      sentimentScore: summary.avg_sentiment_score,
      engagementRate: calculateEngagementRate(summary.engagement_totals),
      sentimentDistribution: summary.sentiment_distribution,
      // ... map other fields
    }
  }

  // Fallback to posts calculation
  return aggregateMetrics(posts)
}
```

---

## Data Mapping

### Summary API → Metrics Cards

| Metric Card | Summary Field | Calculation |
|-------------|---------------|-------------|
| Total Mentions | `total_posts` | Direct |
| Sentiment Score | `avg_sentiment_score` | Direct (0-1 scale) |
| Engagement Rate | `engagement_totals` | `(likes + comments) / views` |
| Positive % | `sentiment_distribution.POSITIVE` | `POSITIVE / total_posts * 100` |
| Viral Count | `viral_count` | Direct |
| Risk Critical | `risk_distribution.CRITICAL` | Direct |

### Summary API → Charts

| Chart | Uses Summary? | Uses Posts? | Notes |
|-------|---------------|-------------|-------|
| Metrics Cards | ✅ Yes | 🔄 Fallback | Summary is primary source |
| Platform Distribution | ✅ Yes | 🔄 Fallback | `platform_distribution` |
| Risk Distribution | ✅ Yes | 🔄 Fallback | `risk_distribution` |
| TopicCloud | ❌ No | ✅ Required | Need keyword aggregation from posts |
| UnifiedChart | ❌ No | ✅ Required | Need time-series data (by day) |
| TopViralPosts | ❌ No | ✅ Required | Need detailed post info |
| CompetitorChart | ⚠️ Partial | ✅ Required | Summary has counts but not SOV per brand |
| SalesFunnel | ❌ No | ✅ Required | Need time comparison data |

---

## Risks / Trade-offs

### Risk 1: Data Inconsistency Between Summary and Posts

**Description**: Summary API and Posts API might return slightly different counts if backend processes posts asynchronously.

**Example**: Summary says `total_posts: 70` but posts API returns 68 posts.

**Likelihood**: Medium (during active crawling/analysis)

**Impact**: Low (minor UI confusion, not breaking)

**Mitigation**:
- Accept eventual consistency as expected behavior
- Display timestamp for each data source ("Summary updated 2 min ago, Posts updated 5 min ago")
- Don't validate or compare counts between sources
- Backend team to ensure atomic updates if possible

---

### Risk 2: Summary API Missing Future Fields

**Description**: As dashboard evolves, summary API might not have all needed aggregations (e.g., SOV per brand, time-series).

**Likelihood**: High (known limitation)

**Impact**: Medium (need to fetch posts for those features)

**Mitigation**:
- Document required vs optional summary fields
- Design for optional summary usage (always fallback-capable)
- Propose backend enhancements in "Future Enhancements" section
- Keep posts-based calculations as authoritative reference

**Future Backend Requests**:
- `brand_sov_distribution: { "BrandA": 40, "BrandB": 35, ... }`
- `mentions_by_day: [{ date: "2024-01-15", count: 12 }, ...]`
- `sentiment_by_day: [{ date: "2024-01-15", positive: 8, negative: 2 }, ...]`
- `top_keywords: [{ keyword: "coffee", count: 30, sentiment: 0.8 }, ...]`

---

### Risk 3: Cache Invalidation Complexity

**Description**: Managing two caches with different TTLs could lead to edge cases (e.g., summary fresh but posts stale).

**Likelihood**: Low (handled by design)

**Impact**: Low (minor UX confusion)

**Mitigation**:
- Clear cache keys and TTL settings
- Invalidate both on manual refresh
- Display last-updated timestamp for each
- Accept that summary and posts might be from different times (show timestamps)

**Edge Case Example**:
```
User visits at 10:00 → Both cached (summary: 10:00, posts: 10:00)
User revisits at 10:04 → Summary expired (refetch), Posts valid (use cache)
Result: Metrics from 10:04, Charts from 10:00
Display: "Metrics updated just now · Charts updated 4 min ago"
```

---

## Migration Plan

### Phase 1: Add Summary API (Non-Breaking)

1. Add `getDashboardSummary()` to service
2. Update `useDashboardData` to fetch summary first
3. Keep posts fetch as-is (backward compatible)
4. Use summary for metrics if available, fallback to posts calculation
5. Deploy and monitor - no user-facing changes yet

**Rollback**: Remove summary fetch, dashboard works as before

---

### Phase 2: Enable Two-Phase Loading

1. Split loading states: `loadingSummary` and `loadingPosts`
2. Display metrics cards as soon as summary loads
3. Show loading spinner for detailed charts until posts load
4. Deploy to staging and validate performance

**Rollback**: Make summary fetch non-blocking, wait for posts before rendering

---

### Phase 3: Optimize Caching

1. Implement independent caches with TTLs (3min, 10min)
2. Test cache invalidation scenarios
3. Monitor cache hit rates and adjust TTLs if needed

**Rollback**: Use single cache or no cache (direct API calls)

---

### Phase 4: Production Rollout

1. Deploy to production with feature flag (optional)
2. Monitor metrics: initial load time, API error rates, cache hit rates
3. Gather user feedback
4. Remove feature flag if successful

**Rollback**: Toggle feature flag off, revert to posts-only

---

## Open Questions

1. **Does summary API need authentication?**
   - Assuming yes (same as posts API, uses HttpOnly cookies)

2. **Should we add request ID for debugging?**
   - Yes, helpful for correlating summary and posts requests in logs

3. **What if summary API is slower than expected (>1s)?**
   - Timeout after 2s, fallback to posts calculation
   - Log slow responses for backend team to investigate

4. **Should we pre-fetch summary on project list page?**
   - Out of scope for this change, but good future enhancement

5. **Can backend add `updated_at` timestamp to summary response?**
   - Would help display "Data as of X min ago"
   - Propose to backend team

---

## Performance Targets

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Initial metrics display | 2-5s | <500ms | Time to render first metric card |
| Full dashboard load | 3-6s | <2s | Time to render all charts |
| API payload (initial) | 500KB-5MB | <50KB | Summary + cached posts |
| API payload (fresh) | 500KB-5MB | 505KB | Summary (5KB) + Posts (500KB) |
| Cache hit rate | 0% (no cache) | >60% | Percentage of page loads using cache |

---

## Success Metrics

- ✅ Summary API called on every dashboard load
- ✅ Metrics cards render in <500ms (p95)
- ✅ Top-keywords API called and TopicCloud renders in <1s (p95)
- ✅ Full dashboard load in <2s (p95)
- ✅ Zero errors from API integrations (graceful fallbacks work)
- ✅ Cache hit rate >60% for repeat visits
- ✅ User feedback: "Dashboard feels faster" in surveys
- ✅ TopicCloud correctly displays aspect colors and rankings

---

## TopicCloud UI/UX Design

### Overview

The TopicCloud component will be redesigned to display keyword data from the `/analytic/top-keywords` API with aspect-based color coding and a ranking table for project keywords.

### Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Trending Keywords                                        │
│                                                              │
│   Word Cloud Area                                           │
│   ┌──────────────────────────────────────────────────────┐ │
│   │                                                        │ │
│   │     tiền      lag        màu                          │ │
│   │  (PRICE)  (PERFORMANCE) (DESIGN)                      │ │
│   │   Orange     Blue       Purple                         │ │
│   │                                                        │ │
│   │       phí          hỗ trợ       đèn                   │ │
│   │     (PRICE)      (SERVICE)    (DESIGN)                │ │
│   │      Orange        Green       Purple                  │ │
│   │                                                        │ │
│   └──────────────────────────────────────────────────────┘ │
│                                                              │
│   Color Legend:                                             │
│   🟠 PRICE  🔵 PERFORMANCE  🟣 DESIGN  🟢 SERVICE          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 🏆 Your Keywords Performance                                │
│                                                              │
│ ▼ TOP 5 KEYWORDS                                            │
│ ┌─────┬───────────┬──────────────┬──────────────────┐      │
│ │ Rank│ Keyword   │ Aspect       │ Sentiment        │      │
│ ├─────┼───────────┼──────────────┼──────────────────┤      │
│ │ #1  │ tiền      │ 🟠 PRICE     │ ████████░░ 85%  │  ⭐  │
│ │     │           │ Top 5        │                  │      │
│ ├─────┼───────────┼──────────────┼──────────────────┤      │
│ │ #3  │ màu       │ 🟣 DESIGN    │ ███████░░░ 70%  │  ⭐  │
│ │     │           │ Top 5        │                  │      │
│ └─────┴───────────┴──────────────┴──────────────────┘      │
│                                                              │
│ ▼ OTHER KEYWORDS                                            │
│ ┌─────┬───────────┬──────────────┬──────────────────┐      │
│ │ #8  │ kiro      │ BRAND        │ █████░░░░░ 45%  │      │
│ ├─────┼───────────┼──────────────┼──────────────────┤      │
│ │ #15 │ giá       │ 🟠 PRICE     │ ███░░░░░░░ 30%  │      │
│ ├─────┼───────────┼──────────────┼──────────────────┤      │
│ │ 20+ │ xe hơi    │ GENERAL      │ █░░░░░░░░░ 10%  │      │
│ │     │           │ (not in top) │                  │      │
│ └─────┴───────────┴──────────────┴──────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Word Cloud Section

**Purpose**: Display top 20 trending keywords visually with size proportional to count.

**Data Source**: `keywords` array from `/analytic/top-keywords`

**Visual Properties**:
- Font size: Scales based on `count` (min 12px, max 48px)
- Color: Based on `aspect` field
- Hover: Show tooltip with keyword, count, aspect, sentiment score

**Color Mapping**:
```typescript
const ASPECT_COLORS = {
  PRICE: '#f59e0b',        // Orange - pricing, cost keywords
  PERFORMANCE: '#3b82f6',  // Blue - performance, speed keywords
  DESIGN: '#8b5cf6',       // Purple - design, aesthetics keywords
  SERVICE: '#10b981',      // Green - service, support keywords
  null: '#6b7280',         // Gray - uncategorized
}
```

**Tooltip Content**:
```
Keyword: tiền
Mentions: 4
Aspect: PRICE
Sentiment: ⭐⭐⭐⭐⭐ (1.0)
```

#### 2. Color Legend

**Purpose**: Help users understand aspect color coding.

**Layout**: Horizontal bar below word cloud with icon + label for each aspect.

**Content**:
```
🟠 PRICE: Pricing & cost-related
🔵 PERFORMANCE: Speed & efficiency
🟣 DESIGN: Aesthetics & appearance
🟢 SERVICE: Support & customer service
```

#### 3. Ranking Table

**Purpose**: Show project keywords with their rankings and performance.

**Data Source**: `input_keyword_ranks` array from `/analytic/top-keywords`

**Sections**:
- **TOP 5 KEYWORDS** (rank < 5): Gold/accent background, "Top 5" badge, star icon
- **OTHER KEYWORDS** (rank >= 5 or not in top): Normal background, no badge

**Columns**:
1. **Rank**: Display as "#1", "#5", "20+" for out-of-top
2. **Keyword**: Text with optional "Top 5" badge
3. **Aspect**: Colored dot + aspect name
4. **Sentiment**: Bar visualization showing POSITIVE/NEUTRAL/NEGATIVE breakdown

**Row Styling**:
```typescript
// Top 5 keywords
background: 'linear-gradient(to right, #fef3c7, transparent)'
borderLeft: '4px solid #f59e0b'
badge: 'Top 5' with gold color

// Other keywords (rank >= 5)
background: 'white'
borderLeft: '2px solid #e5e7eb'

// Not in top 20
background: '#f9fafb'
color: '#9ca3af' (gray)
```

**Sentiment Bar**:
```
████████░░ 85%
Positive: 4, Neutral: 0, Negative: 0
```

### Interaction Design

#### Word Cloud Interactions

1. **Hover**: Show tooltip with keyword details
2. **Click**: (Optional) Filter posts by keyword in other charts
3. **No interactions if fallback data**: Display-only mode

#### Ranking Table Interactions

1. **Hover row**: Slight background color change
2. **Click row**: (Optional) Navigate to keyword detail page
3. **Sort**: (Future) Allow sort by rank, count, or sentiment

### Edge Cases

#### Case 1: Project has no configured keywords

**Behavior**: Hide ranking table entirely, show only word cloud.

**UI**:
```
┌─────────────────────────────────────┐
│ 📊 Trending Keywords                │
│   (Word Cloud)                      │
│                                     │
│   Color Legend                      │
└─────────────────────────────────────┘
```

#### Case 2: All project keywords outside top 20

**Behavior**: Show ranking table but all keywords in "OTHER" section with rank "20+".

**UI**:
```
🏆 Your Keywords Performance

▼ OTHER KEYWORDS
┌─────┬───────────┬──────────────┬──────────────────┐
│ 20+ │ keyword1  │ ASPECT       │ ░░░░░░░░░░ 5%   │
│ 20+ │ keyword2  │ ASPECT       │ ░░░░░░░░░░ 3%   │
└─────┴───────────┴──────────────┴──────────────────┘
```

#### Case 3: Keywords API fails, fallback to posts

**Behavior**: Display word cloud using legacy keyword extraction from posts.

**UI Changes**:
- Word cloud displays WITHOUT aspect colors (all gray or sentiment-based)
- NO ranking table
- Warning message: "⚠️ Keyword aspect data unavailable. Showing basic keywords."

#### Case 4: No project keywords in top 5

**Behavior**: Hide "TOP 5 KEYWORDS" section, show only "OTHER KEYWORDS".

### Responsive Design

**Desktop (>1024px)**:
- Word cloud: Full width
- Ranking table: 2 columns (if many keywords)

**Tablet (768-1024px)**:
- Word cloud: Slightly smaller font sizes
- Ranking table: Single column, full width

**Mobile (<768px)**:
- Word cloud: Compact, smaller fonts
- Ranking table: Simplified (hide sentiment bar, show only rank+keyword+aspect)

### Accessibility

- **Color blindness**: Use shape icons + text labels in addition to colors
- **Screen readers**: Add aria-labels for word sizes and rankings
- **Keyboard navigation**: Tab through ranking table rows

### Animation

- **Word cloud**: Fade-in animation when data loads
- **Ranking table**: Stagger animation (rows appear one by one)
- **Top 5 badge**: Subtle pulse animation to draw attention

### Performance Considerations

- **Word cloud rendering**: Use canvas or SVG for smooth rendering of 20 keywords
- **Debounce hover**: Prevent tooltip flicker
- **Lazy load ranking table**: Render after word cloud is visible

---

## Updated Performance Targets (with Top-Keywords)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Initial metrics display | 2-5s | <500ms | Phase 1: Summary API |
| TopicCloud display | 2-5s | <1s | Phase 2: Top-keywords API |
| Full dashboard load | 3-6s | <2s | Phase 3: All APIs |
| API payload (initial) | 500KB-5MB | <20KB | Summary (5KB) + Keywords (10KB) |
| API payload (fresh) | 500KB-5MB | 515KB | Summary + Keywords + Posts |
| Cache hit rate | 0% (no cache) | >60% | All 3 APIs cached |
