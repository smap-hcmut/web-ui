# Dashboard Unified Chart - Specification

## ADDED Requirements

### Requirement: Time Range Selection with 14-Day Option
The Unified Analytics Dashboard chart SHALL provide a time range selector that includes "Last 14 Days" as an option, in addition to existing ranges (7 days, 30 days, 90 days, 1 year, all time).

#### Scenario: User selects 14-day time range
- **WHEN** user clicks on the time range dropdown in Unified Chart
- **THEN** the dropdown SHALL display "Last 14 Days" option between "Last 7 Days" and "Last 30 Days"
- **AND** when "Last 14 Days" is selected, the option SHALL be highlighted
- **AND** the chart SHALL update to show data for the last 14 days

#### Scenario: User selects 14 days with sufficient data available
- **WHEN** user selects "Last 14 Days" time range
- **AND** API provides 14 or more days of data
- **THEN** chart SHALL display exactly 14 days of data
- **AND** data SHALL show the 14 most recent days
- **AND** X-axis SHALL show dates for all 14 days

### Requirement: Adaptive Data Filtering Based on Availability
The chart SHALL intelligently filter and display data based on both the selected time range AND available data from the API.

#### Scenario: Requested range exceeds available data
- **WHEN** user selects "Last 30 Days" time range
- **AND** API only provides 14 days of data
- **THEN** chart SHALL display all 14 available days
- **AND** chart SHALL NOT show error or empty state
- **AND** time range selector SHALL remain on "Last 30 Days" selection

#### Scenario: Available data exceeds requested range
- **WHEN** user selects "Last 7 Days" time range
- **AND** API provides 14 or more days of data
- **THEN** chart SHALL display only the 7 most recent days
- **AND** older data SHALL be excluded from visualization
- **AND** X-axis SHALL show dates for only the 7 displayed days

#### Scenario: Exact match between requested and available data
- **WHEN** user selects "Last 14 Days" time range
- **AND** API provides exactly 14 days of data
- **THEN** chart SHALL display all 14 days
- **AND** no data SHALL be filtered out
- **AND** chart SHALL render smoothly without flickering

### Requirement: Data Filtering Algorithm
The chart SHALL implement a consistent algorithm for filtering time-series data based on the selected time range.

#### Scenario: Filter data for specific time range
- **WHEN** chart receives validated data array from API
- **AND** user has selected a specific time range (not "all time")
- **THEN** system SHALL calculate cutoff date as `current_date - selected_days`
- **AND** system SHALL filter data points where `date >= cutoff_date`
- **AND** filtered results SHALL be sorted chronologically (oldest to newest)
- **AND** chart SHALL render with filtered dataset

#### Scenario: Handle "all time" range selection
- **WHEN** user selects "All Time" time range
- **THEN** chart SHALL display all available data without date filtering
- **AND** all data points from API SHALL be included
- **AND** X-axis SHALL adjust to accommodate full date range

### Requirement: Sample Data for Development and Testing
The system SHALL provide extended sample data generation to support testing of all time range options including the new 14-day range.

#### Scenario: Generate 14-day sample data
- **WHEN** createSampleUnifiedData() function is called
- **THEN** function SHALL return 14 days of sample data
- **AND** dates SHALL be in chronological order from 14 days ago to today
- **AND** each day SHALL include realistic mentions, sentiment breakdown, and optional critical events
- **AND** sample data SHALL pass validation (validateUnifiedChartData returns true)

#### Scenario: Sample data supports all time ranges
- **WHEN** developer uses sample data for testing time range filtering
- **THEN** 14-day sample data SHALL allow testing:
  - **AND** "Last 7 Days" filtering (shows 7 most recent)
  - **AND** "Last 14 Days" filtering (shows all 14)
  - **AND** "Last 30 Days" filtering (shows all 14 available)
  - **AND** "All Time" filtering (shows all 14)

### Requirement: Time Range Options Configuration
The chart SHALL define time range options as a configurable constant with consistent structure.

#### Scenario: TIME_RANGES constant includes 14-day option
- **WHEN** UnifiedChart component initializes
- **THEN** TIME_RANGES constant SHALL include entry: `{ value: '14d', label: 'Last 14 Days', days: 14 }`
- **AND** entry SHALL be positioned between "7d" and "30d" entries
- **AND** all time range entries SHALL follow format: `{ value: string, label: string, days: number | null }`

### Requirement: Responsive and Smooth Transitions
The chart SHALL provide smooth visual transitions when users switch between time ranges.

#### Scenario: Switch from 7-day to 14-day range
- **WHEN** user changes time range from "Last 7 Days" to "Last 14 Days"
- **THEN** chart SHALL smoothly animate to show additional 7 days of historical data
- **AND** X-axis labels SHALL update to reflect new date range
- **AND** chart height and proportions SHALL remain consistent
- **AND** transition SHALL complete within 500ms

#### Scenario: Switch from 30-day to 7-day range with limited data
- **WHEN** user changes time range from "Last 30 Days" to "Last 7 Days"
- **AND** only 14 days of data are available
- **THEN** chart SHALL smoothly transition from showing 14 days to 7 days
- **AND** most recent 7 days SHALL remain visible
- **AND** older 7 days SHALL be filtered out
- **AND** no error or loading state SHALL appear

## MODIFIED Requirements

None - this is a new capability being added to the dashboard.

## REMOVED Requirements

None - no existing functionality is being removed.

## RENAMED Requirements

None - no requirements are being renamed.
