# Design: Complete i18n Coverage

## Context

SMAP Web đã có hệ thống internationalization (i18n) sử dụng next-i18next với 2 ngôn ngữ (en, vi), nhưng implementation chưa đầy đủ. Audit phát hiện 12 files có text hardcoded, gây ra trải nghiệm không nhất quán khi user chuyển đổi ngôn ngữ.

**Current state:**
- ✅ Infrastructure: next-i18next đã được setup
- ✅ Some components: Một số components đã sử dụng i18n
- ❌ Inconsistent: Nhiều components vẫn hardcode text
- ❌ Mixed languages: Một số text bị "stuck" trong tiếng Việt hoặc tiếng Anh

**Stakeholders:**
- End users: Cần trải nghiệm đa ngôn ngữ nhất quán
- Developers: Cần pattern rõ ràng để maintain và extend
- Product team: Muốn support thêm ngôn ngữ trong tương lai

## Goals / Non-Goals

**Goals:**
- Migrate tất cả hardcoded UI text sang i18n trong 12 files đã xác định
- Đảm bảo 100% text trong UI responsive với language switcher
- Chuẩn hóa translation key structure để dễ maintain
- Vietnamese translations phải tự nhiên và phù hợp context (không dịch word-by-word)
- Giữ nguyên technical terms quan trọng khi cần thiết

**Non-Goals:**
- Không thêm ngôn ngữ mới (chỉ hoàn thiện en/vi)
- Không thay đổi i18n infrastructure (giữ nguyên next-i18next)
- Không migrate files khác ngoài 12 files đã xác định
- Không translate company branding, email addresses, trust badges
- Không implement i18n cho backend messages/errors

## Decisions

### Decision 1: Translation Key Structure

**What:** Sử dụng nested structure với namespace theo feature

**Why:**
- Dễ tìm kiếm và maintain
- Tránh key collision
- Group related translations together
- Consistent với structure hiện tại trong `common.json`

**Structure:**
```
dashboard.header.*           - DashboardHeader component
dashboard.processing.*       - ProjectProcessingState component
dashboard.setup.*            - ProjectSetupWizard component
dashboard.charts.*           - Chart components
projects.status.*            - Project status messages
auth.login.*                 - Login page
auth.register.*              - Register page
auth.verifyOtp.*            - OTP verification
landing.hero.*              - Landing hero section
common.buttons.*            - Reusable button text
common.loading.*            - Loading states
common.errors.*             - Error messages
```

**Alternatives considered:**
- Flat structure: Rejected vì khó scale và tìm kiếm
- One file per component: Rejected vì overhead và next-i18next convention

### Decision 2: Vietnamese Translation Strategy

**What:** Dịch theo nghĩa (meaning-based) không phải từng từ (word-by-word)

**Why:**
- Vietnamese và English có cấu trúc câu khác nhau
- Một số technical terms nên giữ nguyên (Dashboard, AI, API, ROI, etc.)
- User experience cần tự nhiên không phải literal translation

**Examples:**
```
EN: "Real-time Analytics"
VI: "Phân tích thời gian thực" ✅ (not "Phân tích thực-thời gian" ❌)

EN: "Loading chart data..."
VI: "Đang tải dữ liệu biểu đồ..." ✅ (not "Đang load dữ liệu chart..." ❌)

EN: "Try Again"
VI: "Thử lại" ✅ (not "Cố gắng lại" ❌)

EN: "Dashboard"
VI: "Dashboard" or "Bảng điều khiển" ✅ (based on existing translation in common.json)
```

**Guidelines:**
- Keep technical terms: Dashboard, API, WebSocket, AI, ML, ROI
- Translate UI actions naturally: "Try Again" → "Thử lại"
- Adapt length for UI constraints: shorter Vietnamese when needed
- Follow existing patterns in `common.json`

### Decision 3: Company Branding Handling

**What:** Keep company names, emails, and trust badges hardcoded

**Why:**
- Brand names should not be translated (SMAP SOLUTION, INT SOLUTION)
- Email addresses are universal
- Trust badge companies are proper nouns (VNEXPRESS, CAFEBIZ, TECHCOMBANK)
- Consistency with marketing materials

**What stays hardcoded:**
- Company names: SMAP SOLUTION, INT SOLUTION
- Email: contact@smapsolution.com
- Trust badges: VNEXPRESS, CAFEBIZ, TECHCOMBANK

### Decision 4: Migration Approach

**What:** Component-by-component migration with grouped testing

**Why:**
- Minimize risk - can rollback individual components if needed
- Easy to track progress (clear tasks)
- Can parallelize work if needed
- Test in groups (dashboard components, auth pages, etc.)

**Sequence:**
1. Prepare all translation keys first (both en + vi files)
2. Migrate dashboard components (most complex)
3. Migrate navigation components
4. Migrate landing components
5. Migrate auth pages
6. Test and validate

**Alternatives considered:**
- Big bang approach: Rejected vì risky và khó debug
- Per-file migration with immediate testing: Rejected vì repetitive và slower

## Risks / Trade-offs

### Risk 1: Translation Quality
**Risk:** Vietnamese translations might not be natural or contextually appropriate

**Mitigation:**
- Follow existing translation patterns in common.json
- Use Vietnamese speaker for review (if available)
- Test with Vietnamese users
- Keep technical terms in English when appropriate

### Risk 2: Missing Translation Keys
**Risk:** Developer forgets to add key to both en and vi files

**Mitigation:**
- Validate both files have matching structure in task 1.4
- next-i18next shows missing key warnings in development
- Add validation step in tasks (6.2, 6.6)

### Risk 3: Breaking Existing Translations
**Risk:** Modifying existing keys in common.json might break other components

**Mitigation:**
- Only ADD new keys, don't modify existing ones unless fixing bugs
- Search codebase for existing key usage before modifying: `rg "t\('keyname'\)"`
- Test language toggle across entire app

### Risk 4: Text Overflow in UI
**Risk:** Translated text (especially Vietnamese) might be longer and break layouts

**Mitigation:**
- Test responsive behavior in task 6.5
- Use Tailwind's `truncate` classes where appropriate
- Adjust layouts if needed (rare, Vietnamese is often shorter than English)

## Migration Plan

### Phase 1: Preparation (Tasks 1.1-1.4)
1. Create comprehensive translation key structure
2. Add all English translations
3. Add all Vietnamese translations
4. Validate completeness

### Phase 2: Component Migration (Tasks 2.1-5.3)
**Order:** Most complex first → simpler last
1. Dashboard components (most hardcoded text)
2. Navigation components (already partially done)
3. Landing components
4. Auth pages

**Per-component steps:**
1. Import useTranslation hook
2. Replace hardcoded strings with t('key')
3. Remove hardcoded text
4. Keep company branding hardcoded

### Phase 3: Testing (Tasks 6.1-6.6)
1. Functional testing: Language toggle works
2. Visual testing: No hardcoded text visible
3. Content testing: Translations accurate
4. Edge case testing: Long text, missing keys

### Phase 4: Documentation (Tasks 7.1-7.3)
1. Document patterns
2. Add developer guidelines
3. Update component docs

### Rollback Plan
If issues arise:
1. Rollback is per-component (git revert specific commits)
2. Translation files can be updated without code changes
3. Fallback to English if Vietnamese key missing (next-i18next default)

## Open Questions

1. **Q:** Should we add runtime validation for missing translation keys in production?
   **A:** No, next-i18next handles this. Focus on development-time validation.

2. **Q:** Should we translate notification counts (like "3" notifications)?
   **A:** No, numbers are universal. Keep numeric values as-is.

3. **Q:** Should "Social Media Analytics Platform" badge be translated?
   **A:** Yes, this is descriptive text not branding. Already exists in landing.hero.tagline (current: "One input, endless insights").

4. **Q:** What about date/time formats?
   **A:** Out of scope for this change. next-i18next can handle this later if needed.
