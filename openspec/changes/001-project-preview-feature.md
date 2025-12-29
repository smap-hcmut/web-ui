# Change Proposal 001: Project Preview & Dry Run Feature

**Type:** Feature Addition
**Status:** Proposed
**Created:** 2024-12-11
**Spec Reference:** [project-preview-dry-run.md](../specs/project-preview-dry-run.md)
**Complexity:** High
**Estimated Effort:** 15-20 days

---

## Summary

Add a preview/dry run step in the project creation wizard that allows users to see sample data before creating a full project. This involves adding a new wizard step, creating preview components, implementing a new API service method, and updating the project creation flow.

---

## Motivation

Currently, users cannot validate their project configuration (keywords, brands, competitors) until after the project is fully created and executed. This leads to:
- Wasted time and resources on misconfigured projects
- Poor user experience due to lack of feedback
- Uncertainty about data availability before commitment

The preview feature addresses these issues by providing immediate feedback with sample data.

---

## Changes Required

### 1. New Files to Create

#### 1.1 Components

**File:** `components/dashboard/ProjectPreviewStep.tsx`
```typescript
/**
 * Main preview step component that displays sample data and metrics
 * before project creation
 */
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ProjectData } from './ProjectSetupWizard'
import { ProjectPreviewResponse } from '@/lib/api/services/project.service'

interface ProjectPreviewStepProps {
  projectData: ProjectData
  previewData: ProjectPreviewResponse | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
  onBack: () => void
  onNext: () => void
}

export default function ProjectPreviewStep(props: ProjectPreviewStepProps) {
  // Component implementation
  // - Render loading state
  // - Render error state with retry
  // - Render preview data with tabs
  // - Show overview metrics
  // - Display warnings
  // - Show sample posts
}
```
**Estimated Lines:** ~400-500 lines
**Dependencies:** framer-motion, lucide-react

---

**File:** `components/dashboard/preview/PreviewOverview.tsx`
```typescript
/**
 * Displays overall metrics and summary of preview data
 */
interface PreviewOverviewProps {
  summary: {
    total_posts_found: number
    date_coverage: {
      from: string
      to: string
      days_with_data: number
      days_without_data: number
    }
    data_quality_score: number
    estimated_full_data_size: number
  }
}

export default function PreviewOverview({ summary }: PreviewOverviewProps) {
  // Display total posts, date range, quality score, estimates
}
```
**Estimated Lines:** ~150-200 lines

---

**File:** `components/dashboard/preview/PreviewWarnings.tsx`
```typescript
/**
 * Displays warnings and alerts about data quality or configuration issues
 */
interface PreviewWarningsProps {
  warnings: string[]
}

export default function PreviewWarnings({ warnings }: PreviewWarningsProps) {
  // Display warning alerts with icons and color coding
}
```
**Estimated Lines:** ~80-100 lines

---

**File:** `components/dashboard/preview/PreviewTabs.tsx`
```typescript
/**
 * Tab navigation for switching between brand and competitor previews
 */
interface PreviewTabsProps {
  activeTab: 'brand' | 'competitors'
  competitorCount: number
  onTabChange: (tab: 'brand' | 'competitors') => void
}

export default function PreviewTabs(props: PreviewTabsProps) {
  // Tab navigation with active indicators
}
```
**Estimated Lines:** ~100-120 lines

---

**File:** `components/dashboard/preview/EntityPreview.tsx`
```typescript
/**
 * Displays preview data for a single entity (brand or competitor)
 * including metrics, keyword analysis, and sample posts
 */
interface EntityPreviewProps {
  name: string
  type: 'brand' | 'competitor'
  keywords: string[]
  samplePosts: PreviewPost[]
  metrics: PreviewMetrics
  keywordAnalysis: KeywordAnalysis[]
}

export default function EntityPreview(props: EntityPreviewProps) {
  // Display entity metrics, keyword effectiveness, sample posts
}
```
**Estimated Lines:** ~300-350 lines

---

**File:** `components/dashboard/preview/KeywordAnalysisCard.tsx`
```typescript
/**
 * Card component showing effectiveness analysis for a single keyword
 */
interface KeywordAnalysisCardProps {
  keyword: string
  postsFound: number
  avgEngagement: number
  effectivenessScore: number
  suggestion?: string
}

export default function KeywordAnalysisCard(props: KeywordAnalysisCardProps) {
  // Display keyword with star rating, stats, suggestions
}
```
**Estimated Lines:** ~100-120 lines

---

**File:** `components/dashboard/preview/SamplePostCard.tsx`
```typescript
/**
 * Card component displaying a single sample post with engagement metrics
 */
interface SamplePostCardProps {
  post: PreviewPost
}

export default function SamplePostCard({ post }: SamplePostCardProps) {
  // Display post content, author, engagement, sentiment, matched keywords
}
```
**Estimated Lines:** ~150-180 lines

---

**File:** `components/dashboard/preview/PreviewLoadingState.tsx`
```typescript
/**
 * Skeleton loading UI for preview step
 */
export default function PreviewLoadingState() {
  // Animated skeleton components with shimmer effect
  // Loading text with phases
}
```
**Estimated Lines:** ~120-150 lines

---

**File:** `components/dashboard/preview/PreviewErrorState.tsx`
```typescript
/**
 * Error state UI with retry and back options
 */
interface PreviewErrorStateProps {
  error: string
  onRetry: () => void
  onBack: () => void
}

export default function PreviewErrorState(props: PreviewErrorStateProps) {
  // Display error message, retry button, back button
}
```
**Estimated Lines:** ~80-100 lines

---

### 2. Files to Modify

#### 2.1 ProjectSetupWizard.tsx

**File:** `components/dashboard/ProjectSetupWizard.tsx`

**Changes:**

```diff
+ import ProjectPreviewStep from './ProjectPreviewStep'
+ import { ProjectPreviewResponse } from '@/lib/api/services/project.service'

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', description: 'Đặt tên và mô tả project' },
    { id: 2, title: 'Thương hiệu của bạn', description: 'Thêm thương hiệu cần theo dõi' },
    { id: 3, title: 'Đối thủ cạnh tranh', description: 'Thêm các đối thủ để so sánh' },
+   { id: 4, title: 'Xem trước dữ liệu', description: 'Kiểm tra mẫu dữ liệu thu thập được' },
-   { id: 4, title: 'Xác nhận', description: 'Kiểm tra và tạo project' }
+   { id: 5, title: 'Xác nhận', description: 'Kiểm tra và tạo project' }
  ]

  export default function ProjectSetupWizard({ isOpen, onClose, onComplete }: ProjectSetupWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [projectData, setProjectData] = useState<ProjectData>({ /* ... */ })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)

+   // Preview state
+   const [previewData, setPreviewData] = useState<ProjectPreviewResponse | null>(null)
+   const [isLoadingPreview, setIsLoadingPreview] = useState(false)
+   const [previewError, setPreviewError] = useState<string | null>(null)

    const handleNext = async () => {
      if (validateStep(currentStep)) {
+       // Fetch preview data when moving from step 3 to 4
+       if (currentStep === 3) {
+         await fetchPreviewData()
+       }
        setCurrentStep(prev => Math.min(prev + 1, steps.length))
      }
    }

+   const fetchPreviewData = async () => {
+     setIsLoadingPreview(true)
+     setPreviewError(null)
+
+     try {
+       const preview = await projectService.getProjectPreview({
+         name: projectData.name,
+         description: projectData.description,
+         brands: projectData.brands,
+         competitors: projectData.competitors,
+         fromDate: projectData.fromDate,
+         toDate: projectData.toDate,
+         sampleSize: 10
+       })
+
+       setPreviewData(preview)
+     } catch (error: any) {
+       console.error('Preview fetch error:', error)
+       setPreviewError(error.message || 'Không thể tải dữ liệu xem trước')
+
+       // Show error alert
+       await Swal.fire({
+         title: 'Không thể tải xem trước',
+         text: 'Bạn có thể bỏ qua bước này và tiếp tục tạo project.',
+         icon: 'warning',
+         showCancelButton: true,
+         confirmButtonText: 'Thử lại',
+         cancelButtonText: 'Bỏ qua',
+         confirmButtonColor: '#3b82f6',
+         cancelButtonColor: '#6b7280',
+       }).then((result) => {
+         if (result.isConfirmed) {
+           fetchPreviewData()
+         }
+       })
+     } finally {
+       setIsLoadingPreview(false)
+     }
+   }

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="...">
            {/* ... existing steps ... */}

+           {/* Step 4: Preview */}
+           {currentStep === 4 && (
+             <ProjectPreviewStep
+               projectData={projectData}
+               previewData={previewData}
+               isLoading={isLoadingPreview}
+               error={previewError}
+               onRetry={fetchPreviewData}
+               onBack={handlePrevious}
+               onNext={handleNext}
+             />
+           )}

            {/* Step 5: Confirmation (previously step 4) */}
-           {currentStep === 4 && (
+           {currentStep === 5 && (
              <motion.div /* ... confirmation step ... */>
                {/* ... existing confirmation content ... */}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    )
  }
```

**Changes Summary:**
- Add preview state variables (previewData, isLoadingPreview, previewError)
- Add step 4 to steps array, renumber final confirmation to step 5
- Add `fetchPreviewData()` function
- Update `handleNext()` to trigger preview fetch when moving from step 3
- Add conditional rendering for ProjectPreviewStep component
- Update step 5 condition (previously step 4)

**Estimated Lines Changed:** ~80-100 lines added

---

#### 2.2 project.service.ts

**File:** `lib/api/services/project.service.ts`

**Changes:**

```diff
+ // Preview interfaces
+ export interface GetProjectPreviewPayload {
+   name: string
+   description: string
+   brands: Omit<Brand, 'id'>[]
+   competitors: Omit<Brand, 'id'>[]
+   fromDate: string
+   toDate: string
+   sampleSize?: number
+ }
+
+ export interface PreviewPost {
+   id: string
+   title?: string
+   content: string
+   author: string
+   published_at: string
+   platform: 'facebook' | 'twitter' | 'instagram' | 'tiktok' | 'youtube' | 'web'
+   engagement: {
+     likes?: number
+     comments?: number
+     shares?: number
+     views?: number
+   }
+   sentiment?: 'positive' | 'neutral' | 'negative'
+   matched_keywords: string[]
+   url?: string
+ }
+
+ export interface PreviewMetrics {
+   total_posts: number
+   avg_engagement: number
+   sentiment_distribution: {
+     positive: number
+     neutral: number
+     negative: number
+   }
+   top_platforms: Array<{
+     platform: string
+     count: number
+     percentage: number
+   }>
+   engagement_trend: 'increasing' | 'stable' | 'decreasing'
+ }
+
+ export interface KeywordAnalysis {
+   keyword: string
+   posts_found: number
+   avg_engagement: number
+   effectiveness_score: number
+   suggestion?: string
+ }
+
+ export interface ProjectPreviewResponse {
+   preview_id: string
+   brand_preview: {
+     name: string
+     keywords: string[]
+     sample_posts: PreviewPost[]
+     metrics: PreviewMetrics
+     keyword_analysis: KeywordAnalysis[]
+   }
+   competitors_preview: Array<{
+     name: string
+     keywords: string[]
+     sample_posts: PreviewPost[]
+     metrics: PreviewMetrics
+     keyword_analysis: KeywordAnalysis[]
+   }>
+   overall_summary: {
+     total_posts_found: number
+     date_coverage: {
+       from: string
+       to: string
+       days_with_data: number
+       days_without_data: number
+     }
+     data_quality_score: number
+     estimated_full_data_size: number
+   }
+   warnings: string[]
+ }

  export const projectService = {
    // ... existing methods ...

+   // Get project preview (dry run)
+   getProjectPreview: async (
+     payload: GetProjectPreviewPayload
+   ): Promise<ProjectPreviewResponse> => {
+     // Transform to API payload format
+     const brand = payload.brands[0]
+     const competitors = payload.competitors.map(c => ({
+       name: c.name,
+       keywords: c.keywords
+     }))
+
+     const apiPayload = {
+       name: payload.name,
+       description: payload.description,
+       brand_name: brand.name,
+       brand_keywords: brand.keywords,
+       competitors,
+       from_date: payload.fromDate ? formatDateToBackend(payload.fromDate) : formatDateToBackend(new Date().toISOString()),
+       to_date: payload.toDate ? formatDateToBackend(payload.toDate) : formatDateToBackend(new Date().toISOString()),
+       sample_size: payload.sampleSize || 10
+     }
+
+     const response = await apiClient.post<{
+       error_code: number
+       message: string
+       data: ProjectPreviewResponse
+     }>('/project/projects/preview', apiPayload)
+
+     if (response.data.error_code !== 0) {
+       throw new Error(response.data.message || 'Failed to fetch preview')
+     }
+
+     return response.data.data
+   },
  }
```

**Changes Summary:**
- Add preview-related TypeScript interfaces
- Add `getProjectPreview()` method to projectService
- Handle API request/response transformation
- Add error handling

**Estimated Lines Changed:** ~150-180 lines added

---

#### 2.3 Translation Files

**File:** `public/locales/en/common.json`

**Changes:**

```diff
  {
    "projects": {
      /* ... existing translations ... */
+     "preview": {
+       "title": "Data Preview",
+       "subtitle": "Review sample data before creating project",
+       "loading": "Loading sample data...",
+       "analyzingKeywords": "Analyzing keywords...",
+       "collectingData": "Collecting sample posts...",
+       "calculatingMetrics": "Calculating metrics...",
+       "overview": "Overview",
+       "warnings": "Warnings",
+       "brandTab": "Your Brand",
+       "competitorsTab": "Competitors",
+       "totalPosts": "Total Posts Found",
+       "dateRange": "Date Range",
+       "dataQuality": "Data Quality",
+       "estimatedSize": "Estimated Full Data",
+       "keywordAnalysis": "Keyword Analysis",
+       "samplePosts": "Sample Posts",
+       "posts": "posts",
+       "postsFound": "posts found",
+       "avgEngagement": "Average Engagement",
+       "engagement": "Engagement",
+       "sentiment": "Sentiment",
+       "positive": "Positive",
+       "neutral": "Neutral",
+       "negative": "Negative",
+       "platform": "Platform",
+       "matchedKeywords": "Matched Keywords",
+       "publishedAt": "Published",
+       "effectiveness": "Effectiveness",
+       "highEffectiveness": "High effectiveness",
+       "goodEffectiveness": "Good effectiveness",
+       "moderateEffectiveness": "Moderate effectiveness",
+       "lowEffectiveness": "Low effectiveness",
+       "noData": "No data found",
+       "retry": "Retry",
+       "skipPreview": "Skip Preview",
+       "errorTitle": "Cannot Load Preview",
+       "errorMessage": "An error occurred while loading preview data",
+       "noDataWarning": "No data found for this configuration",
+       "lowDataWarning": "Limited data available",
+       "suggestion": "Suggestion",
+       "daysWithData": "Days with data",
+       "daysWithoutData": "Days without data",
+       "viewOriginal": "View Original"
+     }
    }
  }
```

**File:** `public/locales/vi/common.json`

**Changes:**

```diff
  {
    "projects": {
      /* ... existing translations ... */
+     "preview": {
+       "title": "Xem Trước Dữ Liệu",
+       "subtitle": "Xem mẫu dữ liệu trước khi tạo project",
+       "loading": "Đang tải mẫu dữ liệu...",
+       "analyzingKeywords": "Đang phân tích từ khóa...",
+       "collectingData": "Đang thu thập bài đăng mẫu...",
+       "calculatingMetrics": "Đang tính toán chỉ số...",
+       "overview": "Tổng Quan",
+       "warnings": "Cảnh Báo",
+       "brandTab": "Thương Hiệu Của Bạn",
+       "competitorsTab": "Đối Thủ Cạnh Tranh",
+       "totalPosts": "Tổng Số Bài Đăng",
+       "dateRange": "Phạm Vi Ngày",
+       "dataQuality": "Chất Lượng Dữ Liệu",
+       "estimatedSize": "Ước Tính Dữ Liệu Đầy Đủ",
+       "keywordAnalysis": "Phân Tích Từ Khóa",
+       "samplePosts": "Mẫu Bài Đăng",
+       "posts": "bài đăng",
+       "postsFound": "bài đăng tìm thấy",
+       "avgEngagement": "Tương Tác Trung Bình",
+       "engagement": "Tương Tác",
+       "sentiment": "Cảm Xúc",
+       "positive": "Tích Cực",
+       "neutral": "Trung Lập",
+       "negative": "Tiêu Cực",
+       "platform": "Nền Tảng",
+       "matchedKeywords": "Từ Khóa Khớp",
+       "publishedAt": "Đăng Lúc",
+       "effectiveness": "Hiệu Quả",
+       "highEffectiveness": "Hiệu quả cao",
+       "goodEffectiveness": "Hiệu quả tốt",
+       "moderateEffectiveness": "Hiệu quả trung bình",
+       "lowEffectiveness": "Hiệu quả thấp",
+       "noData": "Không tìm thấy dữ liệu",
+       "retry": "Thử Lại",
+       "skipPreview": "Bỏ Qua Xem Trước",
+       "errorTitle": "Không Thể Tải Xem Trước",
+       "errorMessage": "Đã xảy ra lỗi khi tải dữ liệu xem trước",
+       "noDataWarning": "Không tìm thấy dữ liệu cho cấu hình này",
+       "lowDataWarning": "Dữ liệu có sẵn hạn chế",
+       "suggestion": "Gợi Ý",
+       "daysWithData": "Ngày có dữ liệu",
+       "daysWithoutData": "Ngày không có dữ liệu",
+       "viewOriginal": "Xem Gốc"
+     }
    }
  }
```

**Changes Summary:**
- Add complete translation keys for preview feature
- Support both English and Vietnamese
- Cover all UI text, labels, and messages

**Estimated Lines Changed:** ~50-60 lines per locale file

---

### 3. Directory Structure Changes

**New Directories:**
```
components/dashboard/preview/
├── PreviewOverview.tsx
├── PreviewWarnings.tsx
├── PreviewTabs.tsx
├── EntityPreview.tsx
├── KeywordAnalysisCard.tsx
├── SamplePostCard.tsx
├── PreviewLoadingState.tsx
└── PreviewErrorState.tsx
```

**Create directory command:**
```bash
mkdir -p components/dashboard/preview
```

---

## Implementation Checklist

### Phase 1: Setup & Structure (Day 1-2)
- [ ] Create `components/dashboard/preview/` directory
- [ ] Add TypeScript interfaces to `project.service.ts`
- [ ] Add translation keys to locale files
- [ ] Set up basic component files with types

### Phase 2: Core Components (Day 3-7)
- [ ] Implement `PreviewLoadingState.tsx`
- [ ] Implement `PreviewErrorState.tsx`
- [ ] Implement `PreviewOverview.tsx`
- [ ] Implement `PreviewWarnings.tsx`
- [ ] Implement `PreviewTabs.tsx`
- [ ] Add tests for basic components

### Phase 3: Data Display Components (Day 8-11)
- [ ] Implement `SamplePostCard.tsx`
- [ ] Implement `KeywordAnalysisCard.tsx`
- [ ] Implement `EntityPreview.tsx`
- [ ] Style components with Neobrutalism theme
- [ ] Add animations with Framer Motion

### Phase 4: Integration (Day 12-14)
- [ ] Implement main `ProjectPreviewStep.tsx`
- [ ] Update `ProjectSetupWizard.tsx`
- [ ] Add `getProjectPreview()` to `project.service.ts`
- [ ] Wire up data flow and state management
- [ ] Implement error handling and retry logic

### Phase 5: Testing & Refinement (Day 15-17)
- [ ] Test with various data scenarios
- [ ] Test error cases
- [ ] Test loading states
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Performance optimization

### Phase 6: Documentation & Polish (Day 18-20)
- [ ] Add component documentation
- [ ] Update README if needed
- [ ] Add inline code comments
- [ ] Final UI/UX polish
- [ ] Accessibility review
- [ ] Code review and merge

---

## Testing Strategy

### Unit Tests
```typescript
// Example test structure
describe('ProjectPreviewStep', () => {
  it('should render loading state when isLoading is true', () => {})
  it('should render error state when error is present', () => {})
  it('should render preview data when loaded', () => {})
  it('should call onRetry when retry button clicked', () => {})
  it('should call onBack when back button clicked', () => {})
  it('should call onNext when next button clicked', () => {})
})

describe('KeywordAnalysisCard', () => {
  it('should display keyword with correct effectiveness stars', () => {})
  it('should show suggestion when provided', () => {})
  it('should format numbers correctly', () => {})
})

describe('SamplePostCard', () => {
  it('should display post content and author', () => {})
  it('should show engagement metrics', () => {})
  it('should display sentiment indicator', () => {})
  it('should show matched keywords as tags', () => {})
})
```

### Integration Tests
- Test wizard flow with preview step
- Test API service method with mocked responses
- Test error handling and retry flow
- Test navigation between steps

### E2E Tests
- Complete user flow: create project → preview → confirm
- Test back navigation from preview
- Test skip preview scenario
- Test preview with various data qualities

---

## Rollback Plan

If issues arise in production:

1. **Immediate Rollback (< 5 minutes)**
   - Revert commit containing changes
   - Redeploy previous version
   - Steps array reverts to 4 steps

2. **Feature Flag Approach** (Alternative)
   - Add feature flag: `ENABLE_PROJECT_PREVIEW`
   - Conditionally show/hide preview step
   - Allow gradual rollout

```typescript
// In ProjectSetupWizard.tsx
const ENABLE_PREVIEW = process.env.NEXT_PUBLIC_ENABLE_PREVIEW === 'true'

const steps = ENABLE_PREVIEW ? [
  /* 5 steps with preview */
] : [
  /* 4 steps without preview */
]
```

3. **Data Preservation**
   - Preview data is not persisted
   - No database changes required
   - Project creation flow remains unchanged

---

## Performance Considerations

### Frontend
- Lazy load preview components
- Implement virtual scrolling for long post lists
- Debounce API calls
- Cache preview results temporarily (session storage)

```typescript
// Lazy loading
const ProjectPreviewStep = dynamic(
  () => import('./ProjectPreviewStep'),
  { loading: () => <PreviewLoadingState /> }
)
```

### API
- Implement timeout (15 seconds)
- Add request caching on backend
- Implement request queuing
- Rate limiting per user

### Bundle Size Impact
- Estimated increase: ~50-70 KB (minified)
- Components use existing dependencies
- No new heavy libraries required

---

## Security Considerations

### API Security
- [ ] Validate preview request payload
- [ ] Implement rate limiting (max 5 requests per minute per user)
- [ ] Add authentication check
- [ ] Sanitize returned data (XSS prevention)

### Data Privacy
- [ ] Do not log sensitive keywords
- [ ] Anonymize sample posts if needed
- [ ] Temporary preview data (no persistence)
- [ ] Clear preview data on wizard close

---

## Dependencies

### Runtime Dependencies
All dependencies already exist in package.json:
- `framer-motion` - Animations
- `lucide-react` - Icons
- `axios` - API calls
- `next-i18next` - Translations
- `react` & `react-dom` - Core

### Dev Dependencies
No new dev dependencies required.

---

## Breaking Changes

**None.** This is an additive change that:
- Does not modify existing APIs
- Does not change existing component props
- Does not alter database schema
- Maintains backward compatibility

Existing projects and workflows continue to function normally.

---

## Migration Guide

No migration required. This is a new feature that:
- Adds a new optional step to project creation
- Does not affect existing projects
- Does not require data migration
- Users can skip preview if it fails

---

## Monitoring & Metrics

### Success Metrics
- **Preview Usage Rate:** Track % of project creations that use preview
- **Skip Rate:** Track how often users skip preview
- **Retry Rate:** Track preview API retry attempts
- **Error Rate:** Monitor preview API failures
- **Time in Preview:** Average time users spend reviewing preview

### Technical Metrics
- **API Response Time:** p50, p95, p99 for preview endpoint
- **API Error Rate:** 4xx and 5xx errors
- **Frontend Load Time:** Time to render preview
- **Bundle Size:** Monitor increase

### Logging
```typescript
// Example logging
analytics.track('preview_viewed', {
  project_name: projectData.name,
  brands_count: projectData.brands.length,
  competitors_count: projectData.competitors.length,
  date_range_days: dateDiff,
  data_quality_score: previewData.overall_summary.data_quality_score
})

analytics.track('preview_skipped', {
  reason: 'user_action' | 'error' | 'timeout'
})
```

---

## Related Changes

### Future Enhancements (Not in Scope)
- Export preview as PDF/CSV
- Share preview via link
- Advanced filters in preview
- Real-time preview updates
- Preview comparison (A/B testing keywords)

### Documentation Updates
- [ ] Update user guide with preview step
- [ ] Add API documentation for preview endpoint
- [ ] Create video tutorial
- [ ] Update FAQ

---

## Approval & Sign-off

**Developer:** _________________________ Date: _______

**Tech Lead:** _________________________ Date: _______

**Product Owner:** _____________________ Date: _______

---

## Notes

- Backend team must implement `/project/projects/preview` endpoint first
- Coordinate with backend team on response format
- Consider adding feature flag for gradual rollout
- Monitor performance in production closely
- Gather user feedback after 1 week of release

---

## References

- [OpenSpec Specification](../specs/project-preview-dry-run.md)
- [Existing ProjectSetupWizard Implementation](../../components/dashboard/ProjectSetupWizard.tsx)
- [Project Service Implementation](../../lib/api/services/project.service.ts)
- [Design System Guidelines](../project.md#architecture-patterns)
