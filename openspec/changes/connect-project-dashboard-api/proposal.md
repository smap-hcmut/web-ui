# Change: Connect Project Dashboard API Integration

## Why

Hiện tại, trang `/projects/{project_id}/dashboard` đang sử dụng mock data hardcoded trong components ([DashboardGrid.tsx:52-202](../../components/dashboard/DashboardGrid.tsx#L52-L202)). Backend đã cung cấp API endpoint để lấy toàn bộ posts data analyzed, nhưng chưa được tích hợp vào frontend.

Việc tích hợp API thực sẽ cho phép dashboard hiển thị dữ liệu thực từ các jobs đã crawl và analyze, giúp users có insights chính xác về performance của project thay vì dữ liệu giả.

## What Changes

- **Thêm dashboard analytics service**: Tạo service layer để fetch và transform data từ API `/analytic/posts/all` thành format phù hợp cho các chart components
- **Transform raw posts data**: Xây dựng utilities để aggregate raw posts thành metrics (SOV, sentiment, mentions, engagement), topics, viral posts, competitor data, và sales funnel
- **Implement stale-while-revalidate caching**: Thêm caching strategy với React hooks để optimize performance và UX
- **Update DashboardGrid component**: Thay thế mock data bằng real API data với error handling và loading states
- **Update DashboardContext**: Tích hợp API fetching logic vào context để share data across dashboard components

## Impact

### Affected Capabilities
- **dashboard-analytics** (NEW): Core capability cho việc fetch, transform và cache dashboard data
- **project-dashboard-ui**: Cần modify để consume real API data thay vì mock

### Affected Code
- `lib/api/services/` - Thêm `dashboard.service.ts` với API client methods
- `lib/utils/` - Thêm `dashboardDataTransform.ts` với transformation logic
- `hooks/` - Thêm `useDashboardData.ts` với caching và state management
- `contexts/DashboardContext.tsx` - Update để integrate với API service
- `components/dashboard/DashboardGrid.tsx` - Remove mock data, use hook
- `components/dashboard/MetricCard.tsx` - Có thể cần adjust nếu data shape thay đổi

### Breaking Changes
Không có breaking changes. Các components giữ nguyên interface, chỉ thay đổi data source.

### Data Flow
```
API: GET /analytic/posts/all?project_id=X
  ↓
dashboard.service.ts (fetch)
  ↓
dashboardDataTransform.ts (aggregate & transform)
  ↓
useDashboardData hook (cache & state)
  ↓
DashboardContext (share state)
  ↓
DashboardGrid & child components (render)
```

## Dependencies

- Requires backend API endpoint `/analytic/posts/all` to be available and returning data in the documented format
- No new external dependencies needed (sử dụng existing axios client)

## Risks & Mitigations

**Risk 1**: API response time có thể chậm với large datasets (1000+ posts)
- *Mitigation*: Implement stale-while-revalidate caching để show cached data immediately, fetch mới ở background

**Risk 2**: Data transformation logic có thể phức tạp và error-prone
- *Mitigation*: Write comprehensive unit tests cho transformation utilities, validate với sample API responses

**Risk 3**: API có thể thay đổi format hoặc unavailable
- *Mitigation*: Graceful error handling với fallback về empty state hoặc cached data, comprehensive error messages

## Success Criteria

- Dashboard hiển thị real data từ API thay vì mock data
- Loading states hiển thị khi fetching data lần đầu
- Cached data được sử dụng khi revisit dashboard (stale-while-revalidate)
- Error states được handle properly với user-friendly messages
- Performance: Initial load < 2s, subsequent loads instant với cache
- All existing dashboard functionality vẫn hoạt động bình thường
