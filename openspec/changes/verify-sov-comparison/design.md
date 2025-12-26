# Design: Share of Voice Calculation Enhancement

## Context

The current Share of Voice (SOV) calculation in SMAP Web only considers post volume, which can be misleading. A brand with 10 highly-engaged posts may have more market "voice" than a competitor with 20 low-engagement posts.

### Current Implementation

Located in `lib/utils/dashboardDataTransform.ts:298`

```typescript
export function aggregateCompetitors(posts: DashboardPost[]): CompetitorData[] {
  const brandCounts: Record<string, number> = {}

  posts.forEach((post) => {
    brandCounts[post.brand_name] = (brandCounts[post.brand_name] || 0) + 1
  })

  const total = posts.length
  const competitors: CompetitorData[] = Object.entries(brandCounts)
    .map(([brand, count], index) => ({
      brand,
      sov: Math.round((count / total) * 1000) / 10, // Volume-only SOV
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.sov - a.sov)

  return competitors
}
```

## Goals

- Provide accurate SOV metrics that reflect both reach (volume) and impact (engagement)
- Allow users to view SOV from different perspectives
- Maintain backward compatibility with existing dashboards
- Handle edge cases gracefully (missing data, zero values, single brand)

## Non-Goals

- Real-time SOV recalculation (uses cached dashboard data)
- Historical SOV trend analysis (future enhancement)
- Platform-specific SOV breakdown (future enhancement)

## Decisions

### Decision 1: Multi-Metric SOV Approach

**Choice**: Implement three SOV calculation modes: Volume, Engagement, and Weighted

**Rationale**:
- **Volume SOV**: Simple, easy to understand, useful for brand awareness tracking
- **Engagement SOV**: Better reflects actual market impact and audience interaction
- **Weighted SOV**: Balanced view combining both metrics for comprehensive analysis

**Alternatives considered**:
1. ~~Replace volume SOV entirely with engagement SOV~~ - Breaking change, loses historical context
2. ~~Add engagement as separate metric~~ - Creates confusion, users must mentally combine metrics
3. **✅ Multi-mode toggle** - Flexible, educational, backward compatible

### Decision 2: SOV Calculation Formulas

#### Volume-Based SOV (Existing)

```
SOV_volume(brand) = (posts_count(brand) / total_posts) * 100%
```

**Example**:
- Brand A: 30 posts
- Brand B: 20 posts
- Brand C: 50 posts
- Total: 100 posts

Results:
- Brand A: 30%
- Brand B: 20%
- Brand C: 50%

#### Engagement-Based SOV (New)

```
engagement(post) = like_count + comment_count + share_count
total_engagement(brand) = Σ engagement(post) for all posts of brand
SOV_engagement(brand) = (total_engagement(brand) / total_engagement_all) * 100%
```

**Example**:
- Brand A: 30 posts, 15,000 total engagement
- Brand B: 20 posts, 25,000 total engagement
- Brand C: 50 posts, 10,000 total engagement
- Total engagement: 50,000

Results:
- Brand A: 30%
- Brand B: 50% (↑ higher despite fewer posts)
- Brand C: 20% (↓ lower despite most posts)

#### Weighted SOV (New, Default)

```
SOV_weighted(brand) = (w_volume * SOV_volume(brand)) + (w_engagement * SOV_engagement(brand))

where:
  w_volume = 0.4 (40% weight on post count)
  w_engagement = 0.6 (60% weight on engagement)
  w_volume + w_engagement = 1.0
```

**Rationale for 40/60 split**:
- Engagement is generally more important than raw volume for measuring actual brand influence
- Volume still matters for awareness and consistency
- Weights are configurable for future customization

**Example** (using data above):
- Brand A: (0.4 × 30%) + (0.6 × 30%) = 30%
- Brand B: (0.4 × 20%) + (0.6 × 50%) = 38%
- Brand C: (0.4 × 50%) + (0.6 × 20%) = 32%

### Decision 3: Edge Case Handling

| Scenario | Behavior | Rationale |
|----------|----------|-----------|
| Zero total posts | Return empty array `[]` | No data to display, avoid division by zero |
| Single brand | Return 100% SOV for that brand | Technically correct, useful for single-brand analysis |
| Missing engagement data | Fall back to volume SOV | Graceful degradation |
| Negative engagement (data error) | Treat as zero | Data sanitization |
| Brand with zero posts | Exclude from SOV calculation | Cannot have voice without content |

### Decision 4: Data Structure Changes

**Current `CompetitorData` interface**:
```typescript
interface CompetitorData {
  brand: string
  sov: number
  color: string
}
```

**Enhanced `CompetitorData` interface**:
```typescript
interface CompetitorData {
  brand: string
  sov: number              // Primary SOV (defaults to weighted)
  sovVolume: number        // Volume-based SOV
  sovEngagement: number    // Engagement-based SOV
  sovWeighted: number      // Weighted SOV
  postCount: number        // Raw post count
  totalEngagement: number  // Raw engagement sum
  color: string
}
```

**Migration Path**:
- `sov` field defaults to `sovWeighted` for backward compatibility
- Existing chart code continues to work without changes
- New chart features can access detailed metrics via new fields

### Decision 5: UI/UX Design

**Chart Controls**:
```
┌─────────────────────────────────────────────┐
│ Share of Voice Comparison                   │
│ ┌───────────────────────────────────┐       │
│ │ ◉ Weighted  ○ Volume  ○ Engagement │       │
│ └───────────────────────────────────┘       │
│                                             │
│ [Bar Chart Visualization]                   │
└─────────────────────────────────────────────┘
```

**Tooltip Enhancement**:
```
Brand A
─────────────────
Weighted SOV: 38.0%
  • Volume SOV: 20.0%
  • Engagement SOV: 50.0%

Raw Data:
  • Posts: 20
  • Total Engagement: 25,000
```

## Risks / Trade-offs

### Risk: Engagement data quality
**Issue**: Some posts may have missing or inaccurate engagement counts from API

**Mitigation**:
- Fall back to volume SOV when engagement data is unreliable
- Add data quality indicator in UI when using fallback
- Log warnings for missing data in development mode

### Risk: User confusion with multiple metrics
**Issue**: Users may not understand the difference between SOV modes

**Mitigation**:
- Default to Weighted SOV with clear labeling
- Add tooltips explaining each calculation method
- Include help icon with formula explanations
- Show raw numbers alongside percentages

### Risk: Performance with large datasets
**Issue**: Triple calculation (volume + engagement + weighted) may impact performance

**Mitigation**:
- Calculations are O(n) where n = number of posts (already being iterated)
- Memoize results in React components
- All calculations happen during data transformation, not during rendering

## Migration Plan

### Phase 1: Backward-Compatible Addition
1. Add new fields to `CompetitorData` interface (non-breaking)
2. Update `aggregateCompetitors()` to calculate all three SOV metrics
3. Keep existing `sov` field pointing to `sovWeighted`
4. No UI changes yet - internal only

### Phase 2: UI Enhancement
1. Add metric toggle control to CompetitorChart
2. Wire up toggle to switch between SOV modes
3. Update tooltips with detailed breakdowns
4. Add subtle visual indicator for current mode

### Phase 3: Validation & Rollout
1. Test with real project data
2. Gather user feedback
3. Adjust default weights if needed
4. Document in user guide

### Rollback Strategy
If issues arise:
1. Remove metric toggle from UI (hide feature)
2. Revert `sov` field to volume-only calculation
3. Keep new fields for future retry
4. No database changes, so rollback is instant

## Open Questions

1. **Should weights be user-configurable?**
   - Current: No, hardcoded 40/60
   - Future: Could add settings panel for advanced users
   - Decision: Start with fixed weights, gather feedback

2. **Should we track SOV changes over time?**
   - Current: No, single snapshot
   - Future: Store historical SOV in database
   - Decision: Out of scope for this change

3. **Should shares count more than likes?**
   - Current: All engagement types weighted equally
   - Future: Could implement weighted engagement (shares × 2, etc.)
   - Decision: Equal weights for simplicity, can enhance later
