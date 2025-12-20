# Project Navigation Capability - Spec Delta

## ADDED Requirements

### Requirement: Project Detail Page Container
The system SHALL provide a project detail page that serves as a container for all project-specific analytics tools.

#### Scenario: User navigates to project detail page
- **WHEN** user navigates to `/projects/{project_id}`
- **THEN** the system SHALL redirect to `/projects/{project_id}/dashboard` (default tab)
- **AND** the page SHALL display the project detail layout with tab navigation

#### Scenario: Invalid project ID
- **WHEN** user navigates to `/projects/{project_id}` with a non-existent project ID
- **THEN** the system SHALL display an error message
- **AND** offer a link to return to the projects list page

#### Scenario: Project in draft status
- **WHEN** user navigates to a project with status 'draft'
- **THEN** the system SHALL redirect to `/projects` page
- **AND** display a warning message that draft projects cannot be viewed

### Requirement: Tab Navigation Component
The system SHALL provide a tab navigation component that allows users to switch between project analytics tools.

#### Scenario: Display tab navigation
- **WHEN** user is on any `/projects/{project_id}/*` page
- **THEN** the system SHALL display a horizontal tab bar with three tabs: "Dashboard", "Trend Analysis", "Report Wizard"
- **AND** highlight the currently active tab with visual indicator
- **AND** each tab SHALL be clickable to navigate to its corresponding route

#### Scenario: Tab navigation persistence
- **WHEN** user clicks on a tab
- **THEN** the URL SHALL update to `/projects/{project_id}/{tab_name}`
- **AND** the active tab indicator SHALL update accordingly
- **AND** the tab content SHALL render without full page reload (client-side routing)

#### Scenario: Direct URL access to specific tab
- **WHEN** user directly accesses `/projects/{project_id}/trend-analysis` via URL
- **THEN** the system SHALL render the project detail layout
- **AND** activate the "Trend Analysis" tab
- **AND** display the trend analysis content

### Requirement: Dashboard Tab Content
The system SHALL display all existing dashboard analytics within the Dashboard tab.

#### Scenario: Dashboard tab rendering
- **WHEN** user is on `/projects/{project_id}/dashboard`
- **THEN** the system SHALL display all metric cards (SOV, Sentiment, Mentions, Engagement)
- **AND** render all charts (Trend Chart, Sentiment Chart, Competitor Chart, Topic Cloud)
- **AND** render the data table for top performing content
- **AND** all functionality SHALL work identically to the previous `/dashboard` page

### Requirement: Trend Analysis Tab Content
The system SHALL display all existing trend analysis tools within the Trend Analysis tab.

#### Scenario: Trend Analysis tab rendering
- **WHEN** user is on `/projects/{project_id}/trend-analysis`
- **THEN** the system SHALL display the trend dashboard with all filters
- **AND** render trending topics, hashtags, and posts
- **AND** support topic detail modal interactions
- **AND** all functionality SHALL work identically to the previous `/trend-analysis` page

### Requirement: Report Wizard Tab Content
The system SHALL display the report generation wizard within the Report Wizard tab.

#### Scenario: Report Wizard tab rendering
- **WHEN** user is on `/projects/{project_id}/report-wizard`
- **THEN** the system SHALL display the report wizard interface
- **AND** render the multi-step report configuration form
- **AND** support report preview and export functionality
- **AND** all functionality SHALL work identically to the previous `/report-wizard` page

### Requirement: Project Context Integration
The system SHALL automatically set the project context based on the route parameter.

#### Scenario: Automatic project context loading
- **WHEN** user navigates to any `/projects/{project_id}/*` route
- **THEN** the system SHALL extract the project ID from the URL parameter
- **AND** load the corresponding project data into DashboardContext
- **AND** all child components SHALL have access to the correct project context
- **AND** no manual project selection SHALL be required

#### Scenario: Project context updates on navigation
- **WHEN** user navigates from `/projects/project_1/dashboard` to `/projects/project_2/dashboard`
- **THEN** the system SHALL update the project context to project_2
- **AND** reload all data for the new project
- **AND** clear any cached data from the previous project

### Requirement: Responsive Tab Layout
The system SHALL provide a responsive layout for tab navigation across different screen sizes.

#### Scenario: Desktop tab navigation
- **WHEN** user views the project detail page on desktop (>= 1024px width)
- **THEN** tabs SHALL be displayed horizontally in a full-width bar
- **AND** all three tab labels SHALL be fully visible

#### Scenario: Mobile tab navigation
- **WHEN** user views the project detail page on mobile (< 768px width)
- **THEN** tabs SHALL be displayed in a horizontally scrollable container
- **OR** use a dropdown/select menu for tab selection
- **AND** the active tab SHALL be clearly indicated

### Requirement: Visual Design Consistency
The system SHALL maintain visual design consistency with the existing Neobrutalism theme.

#### Scenario: Tab styling
- **WHEN** tabs are rendered
- **THEN** they SHALL use the project's color palette (neo-navy, neo-slate, etc.)
- **AND** active tab SHALL have distinct background and border styling
- **AND** use brutal shadows for visual emphasis
- **AND** support dark mode theme switching
