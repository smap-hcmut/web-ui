# Implementation Tasks

## 1. Data Layer Fixes

- [x] 1.1 Add `permalink` field to `ViralPostData` interface in `lib/utils/dashboardDataTransform.ts`
- [x] 1.2 Update `extractViralPosts` to include `permalink` from `DashboardPost`
- [x] 1.3 Implement smart impact_score normalization logic that handles multiple input ranges:
  - If value > 100, divide by 100 until in 0-100 range
  - If value <= 1, multiply by 100
  - Clamp final value to 0-100 range
- [x] 1.4 Add fallback risk level calculation based on impact_score when `risk_level` is missing or invalid
- [x] 1.5 Add data validation helper function to sanitize viral post data

## 2. Component Updates

- [x] 2.1 Update `TopViralPosts` component props interface to include permalink
- [x] 2.2 Wire ExternalLink button to open `permalink` in new tab
- [x] 2.3 Add disabled state styling for ExternalLink button when permalink is unavailable
- [x] 2.4 Update TypeScript interfaces to reflect new permalink field

## 3. Testing & Validation

- [x] 3.1 Test with API data that has impact_score in different ranges (0-1, 0-100, >100)
- [x] 3.2 Verify progress bars display correctly with normalized scores
- [x] 3.3 Verify permalink links open correctly for all platforms (TikTok, YouTube, Instagram)
- [x] 3.4 Test risk level display with various impact_score values
- [x] 3.5 Test filter functionality with corrected risk levels
- [x] 3.6 Verify no console errors or TypeScript issues

## 4. Documentation

- [x] 4.1 Update code comments in `extractViralPosts` to document normalization logic
- [x] 4.2 Add JSDoc comments for new validation functions
