# Change: Fix WordCloud Stability and Visualization

## Why

The current TopicCloud component in [components/dashboard/charts/TopicCloud.tsx](components/dashboard/charts/TopicCloud.tsx) exhibits unstable behavior where keyword positions constantly shift between renders, making it difficult for users to track trending keywords. The chartjs-chart-wordcloud library lacks deterministic layout capabilities, causing:

1. **Constant repositioning**: Keywords jump around unpredictably on each render
2. **Poor user experience**: Users cannot visually track the same keyword over time
3. **Inconsistent sizing**: Font sizes don't reliably scale proportionally to keyword counts
4. **Aspect visualization limitations**: Current implementation only uses colors; keywords with different aspects are hard to distinguish at a glance

This affects the dashboard's usability since Trending Topics is a key feature for understanding brand sentiment and keyword performance.

## What Changes

- **Replace chartjs-chart-wordcloud with custom HTML/CSS implementation**: Due to React 19 incompatibility with react-wordcloud, implemented a custom word cloud using HTML/CSS with Framer Motion animations
- **Implement deterministic positioning**: Keywords use spiral algorithm with deterministic positioning based on index
- **Fix font sizing**: Font sizes scale proportionally from 14px-48px based on keyword count values
- **Preserve aspect-based color coding**: Maintain existing PRICE/PERFORMANCE/DESIGN/SERVICE color system
- **Improve rendering performance**: Eliminated canvas-based rendering, use React memoization hooks
- **Enhanced interactions**: Hover scale effects, native HTML tooltips, click navigation

## Impact

### Affected specs
- `dashboard-analytics` (new capability, will be created from existing changes)

### Affected code
- [components/dashboard/charts/TopicCloud.tsx](components/dashboard/charts/TopicCloud.tsx) - Complete refactor to use react-wordcloud
- [package.json](package.json) - Add react-wordcloud dependency, remove chartjs-chart-wordcloud
- [contexts/DashboardContext.tsx](contexts/DashboardContext.tsx) - No changes needed (data structure compatible)
- [lib/api/services/dashboard.service.ts](lib/api/services/dashboard.service.ts) - No changes needed (API response format unchanged)

### Dependencies
- Remove: `chartjs-chart-wordcloud` (reduces bundle by ~8KB)
- No new dependencies added - uses existing Framer Motion and React

### Breaking changes
None - API contracts and data structures remain unchanged. Visual appearance differs (custom HTML/CSS cloud instead of canvas) but provides better stability and performance.
