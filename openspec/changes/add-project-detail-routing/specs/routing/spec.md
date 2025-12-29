# Routing Capability - Spec Delta

## ADDED Requirements

### Requirement: Dynamic Project Routes
The system SHALL support dynamic routing for project-specific pages using Next.js dynamic routes.

#### Scenario: Project detail routes structure
- **WHEN** the application is configured
- **THEN** the following routes SHALL be available:
  - `/projects/[project_id]` - Project detail container (redirects to dashboard)
  - `/projects/[project_id]/dashboard` - Dashboard analytics tab
  - `/projects/[project_id]/trend-analysis` - Trend analysis tab
  - `/projects/[project_id]/report-wizard` - Report wizard tab

#### Scenario: Route parameter extraction
- **WHEN** user accesses `/projects/{project_id}/*`
- **THEN** the system SHALL extract the `project_id` from the URL path parameter
- **AND** validate that the project ID exists in the database or context
- **AND** pass the project ID to child components via props or router context

### Requirement: Navigation Link Updates
The system SHALL update all navigation links to use the new routing structure.

#### Scenario: Project list navigation
- **WHEN** user clicks "View" or clicks on a project card in `/projects` page
- **THEN** the system SHALL navigate to `/projects/{project_id}/dashboard`
- **AND** NOT use the old format `/dashboard?project={project_id}`

#### Scenario: Navbar navigation links
- **WHEN** user is viewing a project and clicks a navbar link
- **THEN** if the link is project-specific (Dashboard, Trend Analysis, Report Wizard)
- **THEN** the system SHALL navigate to `/projects/{current_project_id}/{feature}`
- **AND** maintain the current project context

#### Scenario: Sidebar navigation links
- **WHEN** user clicks on sidebar links within the dashboard
- **THEN** all internal links SHALL use the format `/projects/{current_project_id}/{feature}`
- **AND** preserve the project context across navigation

## REMOVED Requirements

### Requirement: Query Parameter Project Selection
**Reason**: Replacing query-based project selection with route-based approach for cleaner URLs and better UX.

**Migration**: All components using `router.query.project` must migrate to `router.query.project_id` from dynamic route parameters.

The system previously supported project selection via query parameter:
- Old format: `/dashboard?project={project_id}`
- New format: `/projects/{project_id}/dashboard`

#### Scenario: Old query parameter handling (REMOVED)
- **WHEN** user navigated to `/dashboard?project=123`
- **THEN** the system would extract project ID from query string
- **AND** set it in DashboardContext

**This behavior is replaced by route parameter extraction in the new structure.**

## MODIFIED Requirements

### Requirement: Static Routes for Standalone Pages
The system SHALL maintain static routes for non-project-specific pages.

**Previous behavior**: Routes like `/dashboard`, `/trend-analysis`, `/report-wizard` existed as standalone pages.

**New behavior**: These routes are REMOVED. The equivalent functionality is now accessed via:
- `/projects/{project_id}/dashboard`
- `/projects/{project_id}/trend-analysis`
- `/projects/{project_id}/report-wizard`

#### Scenario: Access to analysis tools requires project context
- **WHEN** user wants to access dashboard, trend analysis, or report wizard
- **THEN** they MUST first select or navigate to a specific project
- **AND** cannot access these tools without a project context
- **AND** the URL structure SHALL reflect the project-feature hierarchy

### Requirement: Static Site Generation Support
The system SHALL support Next.js SSG (Static Site Generation) for project pages where appropriate.

#### Scenario: Static generation of project routes
- **WHEN** the application builds for production
- **THEN** dynamic routes `/projects/[project_id]/*` SHALL use `getStaticPaths` and `getStaticProps`
- **OR** use `getServerSideProps` if project data requires server-side rendering
- **AND** maintain i18n support with `serverSideTranslations`

#### Scenario: Fallback behavior for unknown projects
- **WHEN** a user accesses a project ID that wasn't pre-rendered at build time
- **THEN** if using ISR (Incremental Static Regeneration), generate the page on-demand
- **OR** if using SSR, fetch project data on each request
- **AND** show 404 page if project doesn't exist
