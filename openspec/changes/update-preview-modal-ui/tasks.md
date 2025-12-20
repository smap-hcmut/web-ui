# Implementation Tasks

## 1. Setup
- [x] 1.1 Create proposal and tasks documentation
- [x] 1.2 Review existing types in `lib/types/dryrun.ts`
- [x] 1.3 Verify sample data structure matches DryRunOuterPayload type

## 2. Create Hardcoded Sample Data
- [x] 2.1 Create new file `components/dashboard/preview/sampleData.ts`
- [x] 2.2 Copy sample data structure from docs/DRY-RUN-DATA-FLOW.md (lines 502-573)
- [x] 2.3 Export typed constant matching DryRunOuterPayload interface
- [x] 2.4 Ensure all required fields are present (meta, content, interaction, author, comments)

## 3. Update ProjectPreviewStep Component
- [x] 3.1 Import sample data from `preview/sampleData.ts`
- [x] 3.2 Add new state: `showRealPreview` (boolean) to track if user wants real data
- [x] 3.3 Add state: `sampleDataMode` (boolean) - true when showing sample data
- [x] 3.4 Modify initial display to show sample data with visual indicator
- [x] 3.5 Add description text: "Dữ liệu preview sẽ bao gồm các thông tin này"
- [x] 3.6 Add button "Xem trước dữ liệu thực tế của project này"
- [x] 3.7 Update button click handler to:
  - Set `showRealPreview` to true
  - Call parent's trigger function (pass via props)
  - Hide sample data indicator
- [x] 3.8 Add visual distinction between sample and real data (banner/badge)

## 4. Update ProjectSetupWizard Component
- [x] 4.1 Remove automatic dry-run trigger from `handleNext()` (lines 162-170)
- [x] 4.2 Create new function `handleTriggerRealPreview()` that calls `triggerDryRun()`
- [x] 4.3 Pass `handleTriggerRealPreview` as prop to ProjectPreviewStep
- [x] 4.4 Add conditional modal sizing:
  - Use `max-w-6xl` when currentStep === 4
  - Use `max-w-2xl` for other steps
- [x] 4.5 Ensure modal height adjusts appropriately (`max-h-[90vh]` with proper overflow)

## 5. Add Translations
- [x] 5.1 Add English translations to `public/locales/en/common.json`:
  - `preview.sampleDataBanner`: "Sample Data Preview"
  - `preview.sampleDataDescription`: "Data preview will include these information"
  - `preview.viewRealDataButton`: "Preview actual project data"
  - `preview.viewingRealData`: "Viewing actual project data"
- [x] 5.2 Add Vietnamese translations to `public/locales/vi/common.json`:
  - `preview.sampleDataBanner`: "Dữ liệu Mẫu"
  - `preview.sampleDataDescription`: "Dữ liệu preview sẽ bao gồm các thông tin này"
  - `preview.viewRealDataButton`: "Xem trước dữ liệu thực tế của project này"
  - `preview.viewingRealData`: "Đang xem dữ liệu thực tế"

## 6. UI Enhancements
- [x] 6.1 Design sample data banner (background color, icon, text)
- [x] 6.2 Style button with appropriate colors (e.g., primary button style)
- [x] 6.3 Add loading spinner when transitioning from sample to real data
- [x] 6.4 Ensure responsive design works with larger modal on mobile
- [x] 6.5 Test dark mode compatibility for new UI elements

## 7. Testing
- [ ] 7.1 Test flow: Step 1 → 2 → 3 → 4 (see sample data)
- [ ] 7.2 Test button click triggers WebSocket connection
- [ ] 7.3 Test lazy loading of real data replaces sample data
- [ ] 7.4 Test user can proceed to step 5 without clicking preview button
- [ ] 7.5 Test modal responsiveness on different screen sizes
- [ ] 7.6 Test error handling when real preview fails
- [ ] 7.7 Verify WebSocket connection only happens when button clicked
- [ ] 7.8 Test both light and dark modes

## 8. Documentation
- [ ] 8.1 Update inline comments in modified files
- [ ] 8.2 Document new prop in ProjectPreviewStep component
- [ ] 8.3 Update component documentation if applicable
