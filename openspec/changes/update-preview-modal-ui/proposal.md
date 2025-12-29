# Change: Cải thiện giao diện Modal tạo Project và xem trước dữ liệu

## Why

Hiện tại, modal tạo project có những hạn chế về trải nghiệm người dùng:
- **Modal quá nhỏ**: Kích thước modal hiện tại (`max-w-2xl`) không đủ không gian để hiển thị dữ liệu preview một cách rõ ràng
- **Preview tự động**: Khi chuyển từ bước 3 sang bước 4, hệ thống tự động trigger dry-run và kết nối WebSocket ngay lập tức, không cho người dùng quyết định
- **Thiếu dữ liệu mẫu**: Người dùng không hiểu được preview sẽ hiển thị gì trước khi thực sự fetch data

Cải thiện này giúp:
- Người dùng có trải nghiệm tốt hơn với không gian hiển thị rộng hơn
- Người dùng chủ động quyết định khi nào muốn xem preview thực tế
- Người dùng hiểu rõ cấu trúc dữ liệu trước khi fetch thực tế

## What Changes

1. **Tăng kích thước modal**
   - Thay đổi từ `max-w-2xl` sang `max-w-6xl` cho step 4 (preview)
   - Các step khác giữ nguyên `max-w-2xl`

2. **Thêm preview dữ liệu mẫu (hardcoded)**
   - Hiển thị dữ liệu mẫu từ docs/DRY-RUN-DATA-FLOW.md (dòng 502-573)
   - Sử dụng cấu trúc `DryRunOuterPayload` với dữ liệu TikTok mẫu
   - Hiển thị mô tả: "Dữ liệu preview sẽ bao gồm các thông tin này"

3. **Thêm button opt-in cho preview thực tế**
   - Thay đổi trigger từ automatic sang manual
   - Thêm button "Xem trước dữ liệu thực tế của project này"
   - Button trigger WebSocket connection và fetch dữ liệu từ backend
   - Lazy loading: hiển thị dữ liệu khi nhận được từ WebSocket

4. **Cập nhật flow**
   - Bước 4 mặc định: Hiển thị dữ liệu mẫu + button
   - Click button: Loading state → WebSocket connection → Lazy load real data
   - Người dùng có thể next mà không cần xem preview thực tế

## Impact

### Affected Specs
- `project-wizard-ui` (new capability) - Modal UI and preview interaction

### Affected Code
- `components/dashboard/ProjectSetupWizard.tsx` (lines 162-170, 726-737, 849)
  - Remove automatic dry-run trigger in `handleNext()`
  - Add dynamic modal sizing based on current step

- `components/dashboard/ProjectPreviewStep.tsx` (entire file)
  - Add hardcoded sample data state
  - Add button to trigger real preview
  - Handle three states: sample data, loading, real data

- `lib/types/dryrun.ts` (check if exists, or create if needed)
  - Ensure types are properly defined for sample data

### Translation Files
- `public/locales/en/common.json`
- `public/locales/vi/common.json`
  - Add new translation keys for sample data description and button text

### No Breaking Changes
- Existing API and WebSocket integration remain unchanged
- All existing functionality preserved
- Opt-in approach means users can skip real preview
