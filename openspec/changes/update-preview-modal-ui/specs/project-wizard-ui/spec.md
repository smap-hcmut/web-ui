# Project Wizard UI Specification

## ADDED Requirements

### Requirement: Modal Responsive Sizing
The project creation wizard modal SHALL dynamically adjust its size based on the current step to optimize content display.

#### Scenario: Preview step shows larger modal
- **WHEN** user navigates to step 4 (preview step)
- **THEN** modal width SHALL be `max-w-6xl` to accommodate preview data
- **AND** modal SHALL maintain `max-h-[90vh]` height with proper overflow handling

#### Scenario: Other steps use standard modal size
- **WHEN** user is on steps 1, 2, 3, or 5
- **THEN** modal width SHALL be `max-w-2xl` for focused input experience
- **AND** modal SHALL maintain consistent padding and spacing

### Requirement: Sample Data Preview
The preview step SHALL display hardcoded sample data by default to demonstrate the structure of expected results before fetching real data.

#### Scenario: Default sample data display
- **WHEN** user first arrives at preview step (step 4)
- **THEN** system SHALL display hardcoded sample data matching DryRunOuterPayload structure
- **AND** sample data SHALL include realistic TikTok post example from documentation
- **AND** UI SHALL show visual indicator that this is sample data

#### Scenario: Sample data structure
- **WHEN** sample data is rendered
- **THEN** it SHALL include complete post structure: meta, content, interaction, author, and comments
- **AND** metrics summary SHALL be calculated from sample data
- **AND** all preview components SHALL render correctly with sample data

### Requirement: Opt-in Real Data Preview
The preview step SHALL provide user control over when to fetch real project data through an explicit action.

#### Scenario: Manual trigger for real data
- **WHEN** user views sample data preview
- **THEN** system SHALL display button with text "Xem trước dữ liệu thực tế của project này"
- **AND** button SHALL be clearly visible and styled as primary action
- **AND** clicking button SHALL trigger WebSocket connection to backend

#### Scenario: WebSocket connection on demand
- **WHEN** user clicks "preview real data" button
- **THEN** system SHALL call triggerDryRun() function
- **AND** system SHALL display loading state while waiting for data
- **AND** WebSocket SHALL NOT connect automatically on step entry
- **AND** system SHALL listen for dry-run results via WebSocket

#### Scenario: Lazy loading real data
- **WHEN** WebSocket receives dry-run result
- **THEN** system SHALL replace sample data with real data
- **AND** sample data indicator SHALL be removed
- **AND** real data indicator SHALL be shown
- **AND** all preview components SHALL update to display real data

#### Scenario: Optional preview workflow
- **WHEN** user is on preview step
- **THEN** user SHALL be able to proceed to next step without clicking preview button
- **AND** navigation controls SHALL remain accessible at all times
- **AND** skipping real preview SHALL NOT block project creation

### Requirement: Preview Data Visual Indicators
The preview step SHALL clearly distinguish between sample data and real data through visual indicators.

#### Scenario: Sample data indicator
- **WHEN** displaying sample data
- **THEN** system SHALL show banner with text "Dữ liệu Mẫu"
- **AND** banner SHALL include description "Dữ liệu preview sẽ bao gồm các thông tin này"
- **AND** visual styling SHALL differentiate from real data state

#### Scenario: Real data indicator
- **WHEN** displaying real data after successful fetch
- **THEN** sample data banner SHALL be hidden
- **AND** system SHALL show success indicator for loaded data
- **AND** existing success/error indicators SHALL continue to work

### Requirement: Internationalization Support
Preview UI elements SHALL support both English and Vietnamese languages through i18n integration.

#### Scenario: Vietnamese translations
- **WHEN** user interface language is Vietnamese
- **THEN** sample data banner SHALL display "Dữ liệu Mẫu"
- **AND** description SHALL display "Dữ liệu preview sẽ bao gồm các thông tin này"
- **AND** button SHALL display "Xem trước dữ liệu thực tế của project này"

#### Scenario: English translations
- **WHEN** user interface language is English
- **THEN** sample data banner SHALL display "Sample Data Preview"
- **AND** description SHALL display "Data preview will include these information"
- **AND** button SHALL display "Preview actual project data"

### Requirement: Backward Compatibility
Changes SHALL maintain all existing functionality of the project creation wizard.

#### Scenario: No breaking changes to API
- **WHEN** implementation is complete
- **THEN** existing WebSocket integration SHALL remain unchanged
- **AND** dry-run API calls SHALL use same structure
- **AND** data types SHALL remain compatible with backend

#### Scenario: Existing features preserved
- **WHEN** user navigates through wizard
- **THEN** all validation rules SHALL continue to work
- **AND** brand and competitor management SHALL function as before
- **AND** final project creation flow SHALL remain identical
- **AND** error handling SHALL continue to work as expected
