# Change: Fix Top Viral Posts Table Display Issues

## Why

The Top Viral Posts data table currently has three critical display and functionality issues:

1. **Impact Score Display Bug**: Impact scores are showing extremely large values (e.g., 10000 instead of 100), making the progress bars overflow and display incorrectly
2. **Non-functional Post URLs**: Users cannot click through to view the actual social media posts because the permalink/URL is not captured or linked
3. **Risk Level Data Issue**: All posts are displaying the same risk level (MEDIUM) regardless of their actual impact scores, reducing the usefulness of risk-based filtering and alerts

These issues prevent users from:
- Quickly assessing post impact through visual progress bars
- Navigating to posts for detailed review
- Identifying and prioritizing high-risk viral content

## What Changes

- **Fix impact score normalization**: Add defensive normalization logic to handle API responses that may return impact_score in different ranges (0-1, 0-100, or larger values)
- **Add permalink support**: Include `permalink` field in `ViralPostData` interface and wire it to the ExternalLink button for clickable post URLs
- **Fix risk level mapping**: Ensure proper risk level assignment based on impact_score when API doesn't provide risk_level, with fallback logic
- **Add data validation**: Implement runtime validation and sanitization for viral posts data to prevent display corruption

## Impact

### Affected Specs
- `dashboard-analytics` (data transformation for viral posts)
- `project-dashboard-ui` (TopViralPosts component display)

### Affected Code
- `lib/utils/dashboardDataTransform.ts` - extractViralPosts function
- `lib/api/services/dashboard.service.ts` - DashboardPost interface
- `components/dashboard/charts/TopViralPosts.tsx` - component rendering and URL handling

### User Impact
- **Improved UX**: Accurate visual representation of impact scores
- **Better workflow**: One-click navigation to source posts
- **Enhanced risk monitoring**: Correct risk level display for better prioritization

### Breaking Changes
None - this is a bug fix that corrects existing behavior to match specifications
