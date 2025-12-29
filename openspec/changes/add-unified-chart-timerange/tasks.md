# Implementation Tasks

## 1. Update UnifiedChart Component
- [x] 1.1 Add "14d" option to TIME_RANGES constant in UnifiedChart.tsx:327-333
- [x] 1.2 Update filteredData useMemo logic to properly slice data based on selected range (UnifiedChart.tsx:374-392)
- [x] 1.3 Ensure filter logic handles edge cases:
  - [x] 1.3.1 When available data < requested days (show all available)
  - [x] 1.3.2 When available data > requested days (show most recent N days)
  - [x] 1.3.3 When data is empty (show empty state)
- [x] 1.4 Test time range filtering with different data scenarios

## 2. Expand Sample Data for Testing
- [x] 2.1 Update createSampleUnifiedData() in chartDataTransform.ts to generate 14 days of data instead of 7
- [x] 2.2 Ensure sample data dates are relative to current date for realistic testing
- [x] 2.3 Add variety to sample data (different mention counts, sentiments, critical events across 14 days)
- [x] 2.4 Verify sample data validation passes with new 14-day dataset

## 3. Data Filtering Logic Enhancement
- [x] 3.1 Implement smart filtering algorithm:
  - [x] 3.1.1 Sort data by date descending (most recent first)
  - [x] 3.1.2 Calculate cutoff date based on selected range
  - [x] 3.1.3 Filter data points >= cutoff date
  - [x] 3.1.4 Return filtered data sorted ascending (oldest to newest for chart)
- [x] 3.2 Add edge case handling for "all time" range
- [x] 3.3 Test filtering with various data sizes (0, 1, 7, 14, 30+ days)

## 4. UI/UX Improvements
- [x] 4.1 Verify "Last 14 Days" label displays correctly in dropdown
- [x] 4.2 Ensure selected range highlights properly when "14d" is selected
- [x] 4.3 Test smooth transitions between different time ranges
- [x] 4.4 Verify chart re-renders correctly when switching ranges

## 5. Testing & Validation
- [x] 5.1 Unit test for TIME_RANGES constant (includes 14d option)
- [x] 5.2 Integration test for filtering logic with 14 days of sample data
- [x] 5.3 Test scenarios:
  - [x] 5.3.1 Select "Last 7 Days" with 14 days available → shows 7 most recent
  - [x] 5.3.2 Select "Last 14 Days" with 14 days available → shows all 14
  - [x] 5.3.3 Select "Last 30 Days" with 14 days available → shows all 14
  - [x] 5.3.4 Select "Last 14 Days" with 7 days available → shows all 7
- [x] 5.4 Visual regression testing on different screen sizes
- [x] 5.5 Performance testing with large datasets (100+ days)

## 6. Documentation
- [x] 6.1 Update component comments to reflect new 14d option
- [x] 6.2 Document filtering logic algorithm in code comments
- [x] 6.3 Add JSDoc for any new utility functions

## 7. Code Review & Cleanup
- [x] 7.1 Review code for consistency with existing patterns
- [x] 7.2 Remove any debug logs or commented code
- [x] 7.3 Ensure TypeScript types are correct
- [x] 7.4 Run linter and fix any issues
- [x] 7.5 Final code review before marking complete
