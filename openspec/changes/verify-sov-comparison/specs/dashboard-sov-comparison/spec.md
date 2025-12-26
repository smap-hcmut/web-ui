# Dashboard Share of Voice Comparison Specification

## ADDED Requirements

### Requirement: Multi-Metric SOV Calculation

The system SHALL calculate Share of Voice (SOV) using three distinct metrics to provide comprehensive brand comparison insights.

#### Scenario: Volume-based SOV calculation
- **GIVEN** multiple brands with varying post counts in a project
- **WHEN** the system calculates Volume-based SOV
- **THEN** each brand's SOV SHALL equal (brand_post_count / total_posts) × 100%
- **AND** the sum of all brand SOV percentages SHALL equal 100%

#### Scenario: Engagement-based SOV calculation
- **GIVEN** posts with engagement data (likes, comments, shares)
- **WHEN** the system calculates Engagement-based SOV
- **THEN** each brand's engagement SHALL be the sum of (like_count + comment_count + share_count) across all posts
- **AND** each brand's SOV SHALL equal (brand_total_engagement / total_engagement) × 100%
- **AND** the sum of all brand SOV percentages SHALL equal 100%

#### Scenario: Weighted SOV calculation with configurable blend
- **GIVEN** both volume and engagement SOV metrics are calculated
- **WHEN** the system calculates Weighted SOV
- **THEN** the formula SHALL be: weighted_sov = (0.4 × volume_sov) + (0.6 × engagement_sov)
- **AND** the weights SHALL be configurable (default: 40% volume, 60% engagement)
- **AND** weights SHALL sum to 1.0 (100%)

### Requirement: SOV Edge Case Handling

The system SHALL handle edge cases in SOV calculation gracefully to prevent errors and provide meaningful results.

#### Scenario: Zero posts in dataset
- **GIVEN** a project with zero analyzed posts
- **WHEN** the system calculates SOV
- **THEN** it SHALL return an empty array
- **AND** no division-by-zero errors SHALL occur

#### Scenario: Single brand in project
- **GIVEN** a project with only one brand
- **WHEN** the system calculates SOV
- **THEN** that brand SHALL have 100% SOV for all metrics

#### Scenario: Missing engagement data
- **GIVEN** posts with null or undefined engagement fields (like_count, comment_count)
- **WHEN** the system calculates Engagement-based SOV
- **THEN** missing values SHALL be treated as zero
- **AND** the system SHALL fall back to Volume-based SOV if all posts lack engagement data

#### Scenario: Negative engagement values (data integrity)
- **GIVEN** posts with negative engagement counts (data error)
- **WHEN** the system calculates SOV
- **THEN** negative values SHALL be treated as zero
- **AND** a warning SHALL be logged in development mode

### Requirement: Enhanced CompetitorData Structure

The system SHALL provide detailed SOV metrics in the CompetitorData interface for rich visualization and analysis.

#### Scenario: Complete SOV data structure
- **GIVEN** SOV calculation has completed
- **WHEN** the system returns CompetitorData
- **THEN** each brand record SHALL include:
  - `brand`: string (brand name)
  - `sov`: number (primary SOV, defaults to weighted)
  - `sovVolume`: number (volume-based SOV percentage)
  - `sovEngagement`: number (engagement-based SOV percentage)
  - `sovWeighted`: number (weighted SOV percentage)
  - `postCount`: number (raw post count)
  - `totalEngagement`: number (sum of all engagement)
  - `color`: string (chart color)

#### Scenario: Backward compatibility
- **GIVEN** existing code expects `sov` field
- **WHEN** CompetitorData is consumed
- **THEN** the `sov` field SHALL default to `sovWeighted` value
- **AND** existing charts SHALL continue to function without modification

### Requirement: SOV Metric Toggle in UI

The system SHALL allow users to switch between different SOV calculation modes in the CompetitorChart component.

#### Scenario: User toggles between SOV metrics
- **GIVEN** the Share of Voice Comparison chart is displayed
- **WHEN** the user clicks the metric toggle control
- **THEN** the chart SHALL update to display the selected SOV metric (Volume, Engagement, or Weighted)
- **AND** the chart bars SHALL re-render with new SOV percentages
- **AND** the transition SHALL be animated smoothly

#### Scenario: Default metric selection
- **GIVEN** the user opens the dashboard for the first time
- **WHEN** the Share of Voice Comparison chart loads
- **THEN** it SHALL default to Weighted SOV metric
- **AND** the Weighted radio button SHALL be selected

#### Scenario: Metric toggle persistence
- **GIVEN** the user selects a specific SOV metric (e.g., Engagement)
- **WHEN** the user refreshes the page or navigates away and back
- **THEN** the selected metric SHALL persist in the user's session
- **AND** the chart SHALL display the previously selected metric

### Requirement: Enhanced SOV Tooltip

The system SHALL display detailed SOV breakdown in chart tooltips to help users understand the metrics.

#### Scenario: Hover over brand in chart
- **GIVEN** the Share of Voice Comparison chart is displayed
- **WHEN** the user hovers over a brand's bar
- **THEN** the tooltip SHALL display:
  - Brand name
  - Current selected SOV percentage
  - Volume SOV percentage
  - Engagement SOV percentage
  - Weighted SOV percentage
  - Raw post count
  - Raw total engagement
- **AND** the tooltip SHALL use clear formatting and labels

#### Scenario: Tooltip with missing engagement data
- **GIVEN** a brand has posts with no engagement data
- **WHEN** the user hovers over that brand's bar
- **THEN** the tooltip SHALL show "Engagement SOV: N/A (using Volume SOV fallback)"
- **AND** the Weighted SOV SHALL also reflect the fallback

### Requirement: SOV Calculation Performance

The system SHALL calculate SOV metrics efficiently to avoid performance degradation on the dashboard.

#### Scenario: Large dataset calculation
- **GIVEN** a project with 1000+ posts across multiple brands
- **WHEN** the dashboard loads and calculates SOV
- **THEN** all three SOV metrics SHALL be calculated in a single O(n) iteration
- **AND** the calculation SHALL complete within 100ms for datasets up to 5000 posts

#### Scenario: Memoized calculations in React
- **GIVEN** the SOV data is displayed in CompetitorChart
- **WHEN** the user interacts with other parts of the dashboard
- **THEN** SOV calculations SHALL NOT re-run unless data changes
- **AND** React useMemo SHALL be used to cache results

### Requirement: SOV Calculation Validation

The system SHALL provide validation and testing utilities to ensure SOV calculation accuracy.

#### Scenario: Unit test for volume SOV
- **GIVEN** sample posts: Brand A (30 posts), Brand B (20 posts), Brand C (50 posts)
- **WHEN** volume SOV is calculated
- **THEN** results SHALL be: Brand A (30%), Brand B (20%), Brand C (50%)
- **AND** sum SHALL equal 100%

#### Scenario: Unit test for engagement SOV
- **GIVEN** sample posts with engagement: Brand A (15,000 total), Brand B (25,000 total), Brand C (10,000 total)
- **WHEN** engagement SOV is calculated
- **THEN** results SHALL be: Brand A (30%), Brand B (50%), Brand C (20%)
- **AND** sum SHALL equal 100%

#### Scenario: Unit test for weighted SOV
- **GIVEN** volume SOV and engagement SOV calculated above
- **WHEN** weighted SOV is calculated with default weights (40% volume, 60% engagement)
- **THEN** results SHALL be:
  - Brand A: (0.4 × 30%) + (0.6 × 30%) = 30%
  - Brand B: (0.4 × 20%) + (0.6 × 50%) = 38%
  - Brand C: (0.4 × 50%) + (0.6 × 20%) = 32%
