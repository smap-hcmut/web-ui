# Change: Add Flexible Time Range Filtering to Unified Analytics Dashboard

## Why

Unified Analytics Dashboard hiện tại có một vấn đề nghiêm trọng: chart chỉ hiển thị cố định 7 ngày dữ liệu, bất kể người dùng chọn time range nào ("Last 7 Days", "Last 30 Days", etc.) và bất kể API trả về bao nhiêu ngày dữ liệu thực tế.

**Các vấn đề cụ thể:**
1. Người dùng chọn "Last 30 Days" nhưng chart vẫn chỉ hiển thị 7 ngày
2. API trả về 14 ngày dữ liệu nhưng chart không tận dụng được
3. Không có tùy chọn "Last 14 Days" trong combo box mặc dù đây là một time range phổ biến
4. Trải nghiệm người dùng kém vì không thấy được dữ liệu đầy đủ theo khoảng thời gian đã chọn

**Tác động:**
- Người dùng không thể phân tích xu hướng dài hạn (30 ngày)
- Mất đi khả năng so sánh dữ liệu giữa các khoảng thời gian khác nhau
- Dữ liệu từ API bị lãng phí (chỉ hiển thị 7/14 ngày có sẵn)

## What Changes

Change này sẽ cải thiện Unified Analytics Dashboard bằng cách:

1. **Thêm time range option mới:**
   - Thêm "Last 14 Days" vào danh sách time range options
   - Giữ nguyên các options hiện có (7d, 30d, 90d, 1y, all)

2. **Sửa logic lọc dữ liệu:**
   - Chart sẽ hiển thị đúng số ngày theo time range được chọn
   - Nếu chọn "Last 30 Days" nhưng API chỉ trả về 14 ngày → hiển thị 14 ngày có sẵn
   - Nếu chọn "Last 7 Days" mà API trả về 14 ngày → hiển thị 7 ngày gần nhất
   - Logic: `min(requested_days, available_days)` và luôn ưu tiên dữ liệu gần nhất

3. **Cải thiện createSampleUnifiedData():**
   - Mở rộng từ 7 ngày lên 14 ngày để hỗ trợ testing
   - Đảm bảo sample data phản ánh đúng các time range scenarios

4. **Tối ưu trải nghiệm người dùng:**
   - Chart tự động điều chỉnh khi có ít dữ liệu hơn yêu cầu
   - Không có lỗi hoặc empty state không cần thiết
   - Responsive và smooth transitions giữa các time ranges

**Không thay đổi:**
- Chart component structure
- API integration layer
- Styling và animations
- Time range selector UI component

## Impact

**Affected specs:**
- `dashboard-unified-chart` (NEW) - Spec mô tả behavior của Unified Analytics Chart

**Affected code:**
- `components/dashboard/charts/UnifiedChart.tsx` (MODIFIED) - Thêm "14d" option, sửa filter logic
- `lib/utils/chartDataTransform.ts` (MODIFIED) - Mở rộng createSampleUnifiedData() lên 14 ngày
- `components/dashboard/TimeRangeSelector.tsx` (REFERENCE) - Không sửa, chỉ reference để hiểu cấu trúc

**Dependencies:**
- Không có breaking changes
- Backward compatible với dữ liệu hiện tại
- API contract không thay đổi

**Testing impact:**
- Cần test với các scenarios: 7d, 14d, 30d data availability
- Cần verify filtering logic với edge cases (empty data, single day, etc.)
- UI/UX testing cho transitions giữa time ranges

**Performance:**
- Không có tác động đáng kể về performance
- Filter logic vẫn là O(n) complexity
- Chart rendering không thay đổi
