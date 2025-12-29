# Change: Add Project Detail Page with Tab-based Navigation

## Why

Hiện tại các trang `/dashboard`, `/trend-analysis`, và `/report-wizard` hoạt động độc lập và không có ngữ cảnh project rõ ràng trong URL. Điều này gây khó khăn khi:
- Người dùng muốn chia sẻ link đến một project cụ thể
- Không có cách tự nhiên để nhóm các chức năng liên quan đến một project
- URL structure không phản ánh mối quan hệ giữa project và các công cụ phân tích

Việc tái cấu trúc routing thành `/projects/{project_id}` với các tab con sẽ cải thiện UX và làm rõ cấu trúc thông tin.

## What Changes

- **Tạo route động mới** `/projects/[project_id]` làm container cho project detail view
- **Tạo nested routes** cho các tab:
  - `/projects/[project_id]/dashboard` - Dashboard analytics (tab mặc định)
  - `/projects/[project_id]/trend-analysis` - Trend analysis tools
  - `/projects/[project_id]/report-wizard` - Report generation wizard
- **Tạo tab navigation UI** hiển thị 3 tabs với visual indicator cho active tab
- **Migrate nội dung** từ các trang cũ sang tab components mới (giữ nguyên 100% functionality)
- **Update project selection logic** để lấy project ID từ route params thay vì query string
- **BREAKING**: Deprecate và xóa các routes cũ `/dashboard`, `/trend-analysis`, `/report-wizard`
- **Update navigation links** trong Navbar, Sidebar, và ProjectList để trỏ đến route mới

## Impact

### Affected Specs
- **project-navigation** (NEW): Spec mới cho project detail page và tab navigation
- **routing** (NEW): Spec mới cho dynamic routing structure

### Affected Code
- **Pages**:
  - DELETE: `pages/dashboard.tsx`
  - DELETE: `pages/trend-analysis.tsx`
  - DELETE: `pages/report-wizard.tsx`
  - CREATE: `pages/projects/[project_id]/index.tsx` (redirect to dashboard tab)
  - CREATE: `pages/projects/[project_id]/dashboard.tsx`
  - CREATE: `pages/projects/[project_id]/trend-analysis.tsx`
  - CREATE: `pages/projects/[project_id]/report-wizard.tsx`

- **Components**:
  - UPDATE: `components/Navbar.tsx` - Update navigation links
  - UPDATE: `components/dashboard/DashboardSidebar.tsx` - Update internal links
  - UPDATE: `pages/projects.tsx` - Change redirect from `/dashboard?project=x` to `/projects/x/dashboard`
  - CREATE: `components/project/ProjectDetailLayout.tsx` - Layout with tab navigation
  - CREATE: `components/project/ProjectTabs.tsx` - Tab navigation component

- **Contexts**:
  - UPDATE: `contexts/DashboardContext.tsx` - May need to handle project ID from route params
  - UPDATE: `contexts/TrendContext.tsx` - Similar updates if needed
  - UPDATE: `contexts/ReportContext.tsx` - Similar updates if needed

### Breaking Changes
- **BREAKING**: Old URLs `/dashboard`, `/trend-analysis`, `/report-wizard` sẽ bị xóa
- **BREAKING**: Bookmarks và external links đến các trang cũ sẽ không hoạt động
- Migration path: Có thể thêm redirect logic nếu cần thiết trong tương lai

### User Impact
- Positive: URL structure rõ ràng hơn, dễ chia sẻ và bookmark
- Positive: Tab navigation giúp chuyển đổi giữa các công cụ phân tích nhanh hơn
- Negative: Users cần làm quen với URL structure mới
