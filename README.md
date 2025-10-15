## SMAP Web — Frontend UI

Modern, responsive frontend for SMAP, serving two primary user roles: A-01 Marketing Analyst and A-02 Community Manager. The app focuses on fast, interactive dashboards and advanced data visualization while keeping query latency and time-to-render low via caching and asynchronous query strategies.

### Table of Contents
- Overview
- Technology Stack
- Roles and User Stories
- Key Features
- Architecture & Data Flow
- State Management
- Data Visualization
- API Integration
- Performance & Non-Functional Requirements
- Caching & Async Query Strategy
- Project Structure
- Environment Variables
- Getting Started
- Development Scripts
- Error Handling & UX
- Accessibility
- Security Considerations
- Observability & Telemetry
- Testing Strategy
- Deployment
- Contributing
- License

### Overview
This frontend delivers dynamic dashboards, project management views, and alert setup forms. It communicates with Go-based backend services (`smap-core-services`), especially the Visualization Service, using REST APIs. The UI is built with a modern framework (React/Vue/Angular) and TypeScript/JavaScript, optimized for responsiveness, interactivity, and low-latency data access.

### Technology Stack
- Framework: React, Vue, or Angular (choose one during implementation) with TypeScript preferred
- Language: TypeScript (recommended) or JavaScript (ES2020+)
- Build: Vite or Webpack (depending on framework selection)
- Styling: CSS Modules, Tailwind CSS, or a component library (e.g., MUI/Ant Design for React)
- Charts: ECharts, Chart.js, or Recharts (for React)
- HTTP: Fetch API or Axios with typed API layer
- State: Redux Toolkit/RTK Query, Vuex/Pinia, or NgRx depending on framework
- Testing: Vitest/Jest + Testing Library; Playwright/Cypress for E2E
- Lint/Format: ESLint, Prettier, Stylelint

### Roles and User Stories
- A-01 Marketing Analyst
  - US-01: View performance dashboards (ABSA comparison, topic trends)
  - US-02: Explore engagement metrics with filters and time ranges
- A-02 Community Manager
  - Manage projects and datasets via Project Management UI
  - US-07: Configure Alert rules and delivery channels

### Key Features
- Dynamic dashboards with interactive charts (zoom, filter, compare)
- Project Management UI for creating, updating, and organizing projects
- Alert Setup UI with validation, preview, and test notifications
- Fast, resilient data fetching with caching and background refresh

### Architecture & Data Flow
1. UI Layer: Pages, widgets, and visualization components
2. State Layer: Normalized entities, derived selectors, and async query caches
3. API Layer: Typed client for `smap-core-services` (Visualization, Projects, Alerts)
4. Visualization: Chart adapters mapping backend series → chart options

High-level flow:
- User interactions dispatch actions or trigger route changes.
- The query layer issues GET/POST requests to `smap-core-services`.
- Responses are normalized and cached; charts consume memoized selectors.
- Background refetch keeps data fresh without blocking the UI.

### State Management
- Prefer a query-aware store (e.g., RTK Query/Pinia Query/NgRx with effects)
- Normalize large collections to avoid redundant renders
- Memoize derived data (selectors) for chart props
- Co-locate slice logic with feature modules

### Data Visualization
- ABSA Comparison Chart: side-by-side sentiment/attribute comparison
- Topic Growth Chart: time-series showing topic frequency/growth
- Chart adapter pattern: convert domain series → chart library options
- Lazy-load heavy chart libraries and annotate axes for clarity

### API Integration
- Base URL points to `smap-core-services` (Go) endpoints
- Endpoints
  - Visualization Service: `/v1/visualization/...` (GET/POST for datasets)
  - Projects Service: `/v1/projects/...`
  - Alerts Service: `/v1/alerts/...`
- Guidelines
  - Use typed request/response models
  - Centralize error handling and retries with backoff
  - Include request correlation IDs for debugging

### Performance & Non-Functional Requirements
- NFR-P2 Query Latency: keep perceived latency low via
  - Stale-while-revalidate: show cached data immediately, refresh in background
  - Progressive rendering: render layout and skeletons first
  - Streaming/Chunked updates when feasible
- Time-to-Render: defer non-critical scripts, split bundles by route, prefetch next-view data
- Avoid re-renders: memoization, virtualization for long lists, stable keys

### Caching & Async Query Strategy
- Cache policies per endpoint: TTL, SWR, and conditional requests (ETag/If-None-Match)
- Background refresh triggered by focus/reconnect/interval
- Optimistic UI where safe (alerts/project updates)
- Request deduplication to prevent thundering herd on rapid re-entries

### Project Structure
Example (React + Vite):
```
src/
  app/                 # app bootstrap, routing
  features/
    dashboard/
    projects/
    alerts/
    visualization/
  shared/
    components/
    hooks/
    lib/              # api client, utils
    state/            # store, slices, query config
  styles/
public/
```

### Environment Variables
- `VITE_API_BASE_URL`: Base URL for `smap-core-services`
- `VITE_ENABLE_MOCKS` (optional): Enable mock handlers in dev
- `VITE_SENTRY_DSN` (optional): Error tracking
- `VITE_ANALYTICS_KEY` (optional): Usage analytics

Create `.env` files as needed (e.g., `.env.local`, `.env.development`).

### Getting Started
1. Prerequisites: Node.js LTS, pnpm/npm/yarn
2. Install dependencies: `pnpm install` (or `npm ci`/`yarn`)
3. Configure `.env.local` with `VITE_API_BASE_URL`
4. Start dev server: `pnpm dev`
5. Open the app at the address shown by the dev server

### Development Scripts
- `dev`: Start development server with HMR
- `build`: Production build with minification and code-splitting
- `preview`: Preview production build locally
- `test`: Run unit tests
- `lint`: Run ESLint/Stylelint

### Error Handling & UX
- Show non-blocking toasts for recoverable errors; inline messages near forms
- Automatic retries with exponential backoff for transient failures
- Graceful fallbacks: skeletons/placeholders for charts while loading

### Accessibility
- Keyboard navigable controls and charts (ARIA roles, focus management)
- Color-contrast safe palettes for charts and UI
- Descriptive alt/labels; prefer semantic HTML

### Security Considerations
- Sanitize user input in forms; encode dynamic content
- Use HTTPS; secure and scoped tokens (no secrets in frontend)
- Apply CORS correctly; avoid exposing sensitive headers

### Observability & Telemetry
- Basic analytics for page views and feature usage
- Error tracking with source maps
- Performance timings: mark API latency and time-to-render

### Testing Strategy
- Unit: components, selectors, reducers, chart adapters
- Integration: API contracts via MSW or similar mocking
- E2E: critical flows (dashboards load, project CRUD, alert creation)

### Deployment
- Build static assets and serve via CDN/edge caching
- Configure cache headers; invalidate on deploy
- Ensure `API_BASE_URL` is environment-specific and not hardcoded

### Contributing
- Use feature branches and conventional commits
- Add/maintain types and tests for new endpoints/features
- Run `lint` and `test` before submitting PRs

### License
Proprietary — internal use within the SMAP project unless stated otherwise.


