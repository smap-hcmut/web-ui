# Change: Complete Internationalization (i18n) Coverage

## Why

Hiện tại project đã có hệ thống i18n (next-i18next) với 2 ngôn ngữ (vi/en) nhưng vẫn còn nhiều text hardcoded trong UI components và pages. Điều này dẫn đến:

- Trải nghiệm người dùng không nhất quán giữa tiếng Việt và tiếng Anh
- Một số phần của ứng dụng bị "stuck" trong một ngôn ngữ dù người dùng chuyển đổi
- Khó bảo trì và mở rộng sang các ngôn ngữ khác trong tương lai

Audit đã phát hiện **12 files** có text hardcoded cần được chuyển sang sử dụng i18n, bao gồm:
- Components (DashboardHeader, ProjectProcessingState, ProjectSetupWizard, UnifiedChart, TopicCloud, Footer, Navbar, và các landing components)
- Pages (login, register, verify-otp)

## What Changes

Đây là non-breaking change nhằm hoàn thiện hỗ trợ đa ngôn ngữ:

1. **Migrate tất cả hardcoded text sang i18n keys** trong 12 files đã xác định
2. **Thêm translation keys mới** vào `public/locales/en/common.json` và `public/locales/vi/common.json`
3. **Đảm bảo tất cả UI text responsive với language toggle** (navbar language switcher)
4. **Chuẩn hóa translation key structure** để dễ maintain:
   - Dashboard-related: `dashboard.*`
   - Project-related: `projects.*`
   - Auth-related: `login.*`, `register.*`, `verifyOtp.*`
   - Landing-related: `landing.*`
   - Common UI: `common.*`

**Các text cần migrate bao gồm:**
- UI labels, buttons, headings
- Error/loading/success messages
- Form placeholders và validation messages
- Status indicators và notifications
- Time range options và chart labels
- Processing step descriptions
- Sample/placeholder data

**Không thay đổi:**
- Company branding (SMAP SOLUTION, INT SOLUTION) - giữ nguyên hardcoded
- Email addresses và contact info cố định
- Trust badge company names (VNEXPRESS, CAFEBIZ, TECHCOMBANK)
- Technical IDs và debug messages

## Impact

**Affected specs:**
- `internationalization` (MODIFIED - comprehensive i18n coverage requirements)

**Affected code:**
- `components/dashboard/DashboardHeader.tsx`
- `components/dashboard/ProjectProcessingState.tsx`
- `components/dashboard/ProjectSetupWizard.tsx`
- `components/dashboard/charts/UnifiedChart.tsx`
- `components/dashboard/charts/TopicCloud.tsx`
- `components/Footer.tsx`
- `components/Navbar.tsx`
- `components/landing/HeroSection.tsx`
- `components/landing/LandingFooter.tsx`
- `pages/login.tsx`
- `pages/register.tsx`
- `pages/verify-otp.tsx`
- `public/locales/en/common.json`
- `public/locales/vi/common.json`

**User-facing changes:**
- Tất cả text trong UI sẽ tự động chuyển đổi ngôn ngữ khi user toggle language
- Trải nghiệm nhất quán hơn giữa tiếng Việt và tiếng Anh
- Không có breaking changes cho existing functionality

**Development impact:**
- Developers cần sử dụng `useTranslation('common')` thay vì hardcode text
- New UI text phải được thêm vào cả 2 locale files (en + vi)
