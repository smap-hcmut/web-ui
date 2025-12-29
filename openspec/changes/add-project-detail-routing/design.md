# Design Document: Project Detail Page with Tab Navigation

## Context

The SMAP application currently uses separate top-level routes (`/dashboard`, `/trend-analysis`, `/report-wizard`) for project analytics tools. Project selection is handled via query parameters (`?project=xxx`) and context state. This structure has limitations:

- URLs don't clearly express the project-feature relationship
- Sharing links to specific project views is cumbersome
- Navigation between tools doesn't feel cohesive
- Project context must be manually maintained across page transitions

### Stakeholders
- End users who need clearer navigation and shareable URLs
- Development team maintaining routing and navigation logic
- Future external API integrations that may reference project URLs

### Constraints
- Must use Next.js Pages Router (not App Router - confirmed by project structure)
- Must maintain i18n support with `next-i18next`
- Must preserve all existing functionality (zero feature regression)
- Must support Neobrutalism design system with dark mode
- Must work with existing WebSocket real-time data system
- Backend API may not be ready - hardcoded chart data is acceptable temporarily

## Goals / Non-Goals

### Goals
- Create a clear URL hierarchy: `/projects/{project_id}/{feature}`
- Implement tab-based navigation within project detail pages
- Migrate all existing page content without functionality loss
- Improve user experience with contextual navigation
- Maintain responsive design (desktop and mobile)
- Support direct URL access to any tab

### Non-Goals
- Redesigning the visual appearance of existing components (only restructuring)
- Implementing new analytics features beyond the existing three tabs
- Adding authentication/authorization changes
- Optimizing backend API calls (out of scope for routing changes)
- Adding redirect logic from old URLs to new URLs (breaking change is acceptable)

## Decisions

### Decision 1: Use Next.js Dynamic Routes for Project ID
**Choice**: Implement `/projects/[project_id]/` directory structure with nested routes.

**Alternatives Considered**:
1. **Query parameters (current approach)**: `/dashboard?project=xxx`
   - ❌ Not semantic, hard to share
   - ❌ Doesn't express hierarchy
2. **Hash-based routing**: `/projects#dashboard/xxx`
   - ❌ Not SEO-friendly
   - ❌ Poor SSR/SSG support
3. **Subdomain-based**: `{project-id}.smap.app/dashboard`
   - ❌ Overkill for use case
   - ❌ Requires complex infrastructure

**Rationale**: Dynamic routes provide clean URLs, support SSG/SSR, work well with Next.js conventions, and clearly express the project-feature hierarchy.

### Decision 2: Tab Navigation with Client-Side Routing
**Choice**: Use Next.js `Link` components for tab switching with client-side navigation.

**Alternatives Considered**:
1. **JavaScript-only tab switching** (no URL changes)
   - ❌ Can't bookmark specific tabs
   - ❌ Can't share direct links to tabs
2. **Full page reload on tab change**
   - ❌ Slow, poor UX
   - ❌ Loses client state unnecessarily
3. **Hash-based tabs**: `/projects/xxx#dashboard`
   - ❌ Less clean than path-based

**Rationale**: Client-side routing with URL updates provides the best UX (fast), supports bookmarking/sharing, and maintains browser history.

### Decision 3: Default Tab Redirect
**Choice**: `/projects/[project_id]` (without tab) redirects to `/projects/[project_id]/dashboard`

**Implementation**: Use `useEffect` with `router.push` or Next.js redirect in `getServerSideProps`.

**Rationale**: Dashboard is the most commonly accessed tool and serves as the natural "home" view for a project.

### Decision 4: Shared Layout Component
**Choice**: Create `ProjectDetailLayout` component that wraps all tab pages and includes tab navigation.

**Structure**:
```
<ProjectDetailLayout>
  <ProjectTabs /> {/* Tab navigation bar */}
  {children} {/* Tab content (dashboard/trend/report) */}
</ProjectDetailLayout>
```

**Alternatives Considered**:
1. **Duplicate layout in each page**
   - ❌ DRY violation
   - ❌ Hard to maintain consistency
2. **Use Next.js `_app.tsx` conditional rendering**
   - ❌ Makes _app.tsx too complex
   - ⚠️ Harder to debug layout-specific issues

**Rationale**: Shared layout component promotes reusability, consistency, and easier maintenance.

### Decision 5: Project Context Initialization
**Choice**: Extract `project_id` from `router.query` in each page's component mount and update `DashboardContext`.

**Implementation Pattern**:
```typescript
const router = useRouter()
const { project_id } = router.query
const { setProject } = useDashboard()

useEffect(() => {
  if (project_id && typeof project_id === 'string') {
    setProject(project_id)
  }
}, [project_id, setProject])
```

**Alternatives Considered**:
1. **Layout-level context initialization**
   - ⚠️ Complexity in ensuring context loads before children render
2. **Higher-order component wrapper**
   - ⚠️ Adds abstraction layer
   - ⚠️ Harder to debug

**Rationale**: Inline initialization in page components is explicit, easy to debug, and works well with Next.js lifecycle.

### Decision 6: Mobile Tab Navigation Pattern
**Choice**: Use horizontally scrollable tab bar on mobile (< 768px), same as desktop but with overflow scroll.

**Alternatives Considered**:
1. **Dropdown/Select menu**
   - ❌ Less visual, harder to scan
   - ❌ Extra click required
2. **Bottom navigation bar**
   - ⚠️ Conflicts with footer on mobile
   - ⚠️ Non-standard for desktop users

**Rationale**: Scrollable tabs maintain consistency across screen sizes, are familiar UX pattern, and work well with touch gestures.

### Decision 7: Hardcoded Chart Data Strategy
**Choice**: Keep hardcoded/mock data in components temporarily until backend API is ready.

**Rationale**: Per project constraints, backend may not provide real data yet. Mock data allows frontend development to proceed independently. Easy to swap with API calls later.

## Risks / Trade-offs

### Risk 1: Breaking Change - Old URLs Stop Working
**Impact**: High - Users with bookmarks or external links will get 404 errors.

**Mitigation**:
- Document the URL changes in release notes
- If needed in future, add redirect middleware from old routes to new routes (not in initial implementation)
- Communicate changes to users before deployment

**Trade-off Accepted**: Clean URL structure justifies breaking change for a better long-term UX.

### Risk 2: SSG/SSR Complexity with Dynamic Routes
**Impact**: Medium - Dynamic routes require `getStaticPaths` or `getServerSideProps`, which adds complexity.

**Mitigation**:
- Start with `getServerSideProps` for simplicity (SSR on each request)
- Optimize to SSG + ISR later if performance requires it
- Ensure i18n integration works correctly with chosen approach

**Trade-off**: SSR is slightly slower but simpler to implement initially. Optimize only if needed.

### Risk 3: Context Synchronization Across Tabs
**Impact**: Medium - Switching tabs could cause context state inconsistencies if not handled properly.

**Mitigation**:
- Use single source of truth: `router.query.project_id`
- Always sync context on route change
- Add validation that project exists before rendering tab content

**Trade-off**: Slight performance overhead of re-validating context, but ensures correctness.

### Risk 4: Mobile Tab Navigation UX
**Impact**: Low-Medium - Scrollable tabs might not be discoverable if not styled clearly.

**Mitigation**:
- Add visual indicators (gradient fade at edges) to show more tabs exist
- Ensure active tab is always scrolled into view
- Test on real devices for thumb-friendly tap targets

### Risk 5: WebSocket Connection Stability
**Impact**: Medium - Ensure WebSocket connections persist correctly when navigating between tabs.

**Mitigation**:
- Test WebSocket behavior with new routing
- Ensure WebSocket service is mounted at layout level, not re-initialized per tab
- Verify real-time data updates work on all tabs

## Migration Plan

### Phase 1: Create New Routes (Non-Breaking)
1. Create new page structure under `/pages/projects/[project_id]/`
2. Create shared layout and tab components
3. Migrate content from old pages to new pages
4. Test new routes alongside old routes (both exist temporarily)

### Phase 2: Update Navigation Links
1. Update all internal navigation to use new routes
2. Test thoroughly in dev environment
3. Verify all user flows work with new routes

### Phase 3: Remove Old Routes (Breaking)
1. Delete old page files (`dashboard.tsx`, `trend-analysis.tsx`, `report-wizard.tsx`)
2. Verify no references remain in codebase
3. Update documentation

### Rollback Plan
If critical issues arise post-deployment:
- Git revert the commit(s) that removed old routes
- Restore old pages from version control
- Investigate and fix issues before re-attempting

### Success Criteria
- [ ] All three tabs render correctly with full functionality
- [ ] Direct URL access to any tab works
- [ ] Browser back/forward buttons work correctly
- [ ] Tab navigation updates URL and browser history
- [ ] Mobile responsive design works on real devices
- [ ] Dark mode works on all tabs
- [ ] i18n language switching works
- [ ] WebSocket real-time updates work on all tabs
- [ ] No console errors or warnings
- [ ] Build passes with no TypeScript errors

## Open Questions

1. **Should we add redirect logic from old URLs to new URLs?**
   - Decision pending: Depends on whether external users exist and how critical bookmarks are
   - Recommendation: Start without redirects (breaking change), add later only if needed

2. **Should we prefetch tab content for faster navigation?**
   - Decision pending: Measure performance first
   - Recommendation: Implement only if tab switching feels slow

3. **Should we add analytics tracking for tab usage?**
   - Decision pending: Depends on product requirements
   - Recommendation: Add basic event tracking (tab view events) if analytics infrastructure exists

4. **Should we lazy load tab content?**
   - Decision pending: Depends on bundle size impact
   - Recommendation: Measure bundle size first, implement code splitting only if needed
