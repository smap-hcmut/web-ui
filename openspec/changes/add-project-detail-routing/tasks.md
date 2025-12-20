# Implementation Tasks

## 1. Setup Project Structure
- [x] 1.1 Create `pages/projects/[project_id]/` directory structure
- [x] 1.2 Create `components/project/` directory for shared project components
- [x] 1.3 Review and document current component dependencies

## 2. Create Project Detail Layout Components
- [x] 2.1 Create `components/project/ProjectDetailLayout.tsx` - Main layout wrapper with Navbar, Footer, and tab container
- [x] 2.2 Create `components/project/ProjectTabs.tsx` - Tab navigation component with three tabs
- [x] 2.3 Implement responsive tab design (horizontal on desktop, scrollable/dropdown on mobile)
- [x] 2.4 Add active tab highlighting with Neobrutalism styling
- [x] 2.5 Add dark mode support to tab components
- [x] 2.6 Test tab navigation state management

## 3. Create Dynamic Route Pages
- [x] 3.1 Create `pages/projects/[project_id]/index.tsx` - Redirect handler to dashboard tab
- [x] 3.2 Create `pages/projects/[project_id]/dashboard.tsx` - Dashboard tab page
- [x] 3.3 Create `pages/projects/[project_id]/trend-analysis.tsx` - Trend analysis tab page
- [x] 3.4 Create `pages/projects/[project_id]/report-wizard.tsx` - Report wizard tab page
- [x] 3.5 Implement `getStaticProps` or `getServerSideProps` with i18n support for all pages
- [x] 3.6 Add proper TypeScript types for route parameters

## 4. Migrate Content from Old Pages
- [x] 4.1 Extract DashboardContent logic from `pages/dashboard.tsx` into reusable component
- [x] 4.2 Move DashboardContent to `pages/projects/[project_id]/dashboard.tsx`
- [x] 4.3 Extract TrendAnalysisContent from `pages/trend-analysis.tsx` into reusable component
- [x] 4.4 Move TrendAnalysisContent to `pages/projects/[project_id]/trend-analysis.tsx`
- [x] 4.5 Extract ReportWizardContent from `pages/report-wizard.tsx` into reusable component
- [x] 4.6 Move ReportWizardContent to `pages/projects/[project_id]/report-wizard.tsx`
- [x] 4.7 Verify all components render correctly in new location

## 5. Update Project Context Logic
- [x] 5.1 Update components to read project ID from `router.query.project_id` (route param) instead of `router.query.project`
- [x] 5.2 Add project ID validation and error handling for invalid/non-existent projects
- [x] 5.3 Implement automatic project context loading based on route parameter
- [x] 5.4 Add loading states while project data is being fetched
- [x] 5.5 Handle project status checks (redirect draft projects to /projects)
- [x] 5.6 Test context updates when navigating between different projects

## 6. Update Navigation Links
- [x] 6.1 Update `pages/projects.tsx` - Change handleViewProject to navigate to `/projects/{id}/dashboard`
- [x] 6.2 Update `components/Navbar.tsx` - Update dashboard/trend-analysis/report-wizard links to use project context
- [x] 6.3 Update `components/dashboard/DashboardSidebar.tsx` - Update all internal navigation links
- [x] 6.4 Search and update any other components with hardcoded `/dashboard`, `/trend-analysis`, `/report-wizard` links
- [x] 6.5 Test all navigation flows to ensure correct routing

## 7. Handle Edge Cases and Validation
- [x] 7.1 Implement 404 page for non-existent project IDs
- [x] 7.2 Add error boundary for project loading failures
- [x] 7.3 Handle direct URL access to tabs (ensure layout and project context load correctly)
- [x] 7.4 Test navigation with projects in different statuses (completed, process, draft)
- [x] 7.5 Verify WebSocket connections work correctly with new routing
- [x] 7.6 Test real-time data updates in new tab structure

## 8. Remove Deprecated Pages
- [x] 8.1 Delete `pages/dashboard.tsx`
- [x] 8.2 Delete `pages/trend-analysis.tsx`
- [x] 8.3 Delete `pages/report-wizard.tsx`
- [x] 8.4 Search codebase for any remaining references to old routes
- [x] 8.5 Update any documentation or README files referencing old routes

## 9. Testing and QA
- [x] 9.1 Test tab navigation on desktop browsers (Chrome, Firefox, Safari, Edge)
- [x] 9.2 Test tab navigation on mobile devices (iOS Safari, Android Chrome)
- [x] 9.3 Test direct URL access to all tab routes
- [x] 9.4 Test browser back/forward buttons with tab navigation
- [x] 9.5 Test project switching (navigate from project A to project B)
- [x] 9.6 Test with different project statuses (completed, process, draft)
- [x] 9.7 Test dark mode appearance across all tabs
- [x] 9.8 Test i18n language switching in new routes
- [x] 9.9 Verify all charts and visualizations render correctly in tabs
- [x] 9.10 Test WebSocket real-time updates in all tabs
- [x] 9.11 Performance test: ensure no degradation from previous implementation

## 10. Deployment and Documentation
- [x] 10.1 Run build to ensure all pages compile successfully
- [x] 10.2 Test production build locally with `npm run build && npm start`
- [ ] 10.3 Update user documentation if applicable
- [ ] 10.4 Create release notes documenting the routing changes
- [ ] 10.5 Plan communication strategy for users about URL changes (if external users exist)
