# Change: Verify and Enhance Share of Voice Comparison

## Why

The Share of Voice (SOV) Comparison chart in the dashboard currently calculates SOV based only on post count, which doesn't accurately reflect brand dominance when engagement levels vary significantly. A brand with fewer posts but higher engagement may have more actual "voice" in the market than the raw post count suggests.

We need to verify the current SOV calculation logic and enhance it to provide a more comprehensive and accurate view by incorporating both post volume and engagement metrics (likes, comments, shares).

## What Changes

- **Verify Current SOV Calculation**: Audit the existing `aggregateCompetitors()` function in [lib/utils/dashboardDataTransform.ts](lib/utils/dashboardDataTransform.ts:298) to ensure it correctly calculates SOV from post data
- **Add Dual-Metric SOV Calculation**: Introduce a new weighted SOV formula that combines:
  - **Volume-based SOV**: Current metric (posts count)
  - **Engagement-based SOV**: New metric (total engagement: likes + comments + shares)
  - **Weighted SOV**: Configurable blend of both metrics (default: 50% volume, 50% engagement)
- **Update CompetitorChart Component**: Enhance [components/dashboard/charts/CompetitorChart.tsx](components/dashboard/charts/CompetitorChart.tsx:1) to display the enhanced SOV metrics with toggle between Volume/Engagement/Weighted views
- **Add Data Validation**: Ensure SOV calculations handle edge cases (zero posts, missing engagement data, single brand scenarios)

## Impact

### Affected specs
- `dashboard-sov-comparison` (NEW capability)

### Affected code
- `lib/utils/dashboardDataTransform.ts` - Add new SOV calculation functions
- `components/dashboard/charts/CompetitorChart.tsx` - Update to display multi-metric SOV
- `contexts/DashboardContext.tsx` - May need to expose SOV calculation mode
- Type definitions for `CompetitorData` interface

### User-facing changes
- Dashboard SOV chart will show more accurate brand comparison
- Users can toggle between different SOV calculation modes
- Better insights when brands have different engagement patterns

### Non-breaking changes
- Default behavior remains volume-based SOV for backward compatibility
- New features are opt-in via chart controls
