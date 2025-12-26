# Implementation Tasks

## 1. Verification & Analysis

- [x] 1.1 Audit current `aggregateCompetitors()` function logic
- [x] 1.2 Test current SOV calculation with sample data (multiple brands, varying post counts)
- [x] 1.3 Document edge cases (zero posts, single brand, missing data)
- [x] 1.4 Verify data flow from API → transformation → chart rendering

## 2. Design SOV Calculation Formulas

- [x] 2.1 Design Volume-based SOV formula (verify existing)
- [x] 2.2 Design Engagement-based SOV formula
- [x] 2.3 Design Weighted SOV formula (configurable blend)
- [x] 2.4 Define default weights and configuration options

## 3. Implementation - Data Layer

- [x] 3.1 Update `CompetitorData` interface to include new SOV metrics
- [x] 3.2 Implement `calculateVolumeSOV()` helper function
- [x] 3.3 Implement `calculateEngagementSOV()` helper function
- [x] 3.4 Implement `calculateWeightedSOV()` helper function
- [x] 3.5 Update `aggregateCompetitors()` to use new calculations
- [x] 3.6 Add data validation and edge case handling

## 4. Implementation - UI Layer

- [x] 4.1 Add SOV metric toggle control to CompetitorChart
- [x] 4.2 Update chart data rendering to support multiple SOV views
- [x] 4.3 Add tooltip to explain each SOV calculation method
- [x] 4.4 Update chart legend with current SOV metric indicator
- [x] 4.5 Ensure responsive design for metric toggle

## 5. Testing & Validation

- [x] 5.1 Unit test SOV calculation functions with edge cases
- [x] 5.2 Integration test with real API data
- [x] 5.3 Visual regression test for chart rendering
- [x] 5.4 Test metric toggle functionality
- [x] 5.5 Test with zero/missing data scenarios

## 6. Documentation

- [x] 6.1 Add JSDoc comments to new functions
- [x] 6.2 Update type definitions with inline documentation
- [x] 6.3 Document SOV formula in design.md
- [x] 6.4 Add usage examples in code comments
