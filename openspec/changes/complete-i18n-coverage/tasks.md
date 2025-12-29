# Implementation Tasks

## 1. Preparation & Translation Keys
- [ ] 1.1 Audit and create comprehensive translation key structure in both locale files
- [ ] 1.2 Add all English translations to `public/locales/en/common.json`
- [ ] 1.3 Add all Vietnamese translations to `public/locales/vi/common.json`
- [ ] 1.4 Validate translation files structure and completeness

## 2. Dashboard Components Migration
- [ ] 2.1 Migrate `components/dashboard/DashboardHeader.tsx` to use i18n
- [ ] 2.2 Migrate `components/dashboard/ProjectProcessingState.tsx` to use i18n (largest file with most hardcoded text)
- [ ] 2.3 Migrate `components/dashboard/ProjectSetupWizard.tsx` to use i18n
- [ ] 2.4 Migrate `components/dashboard/charts/UnifiedChart.tsx` to use i18n
- [ ] 2.5 Migrate `components/dashboard/charts/TopicCloud.tsx` to use i18n

## 3. Navigation & Layout Components Migration
- [ ] 3.1 Migrate `components/Footer.tsx` to use i18n (update existing incomplete implementation)
- [ ] 3.2 Migrate `components/Navbar.tsx` to use i18n (update existing incomplete implementation)

## 4. Landing Page Components Migration
- [ ] 4.1 Migrate `components/landing/HeroSection.tsx` to use i18n
- [ ] 4.2 Migrate `components/landing/LandingFooter.tsx` to use i18n

## 5. Authentication Pages Migration
- [ ] 5.1 Migrate `pages/login.tsx` to use i18n
- [ ] 5.2 Migrate `pages/register.tsx` to use i18n
- [ ] 5.3 Migrate `pages/verify-otp.tsx` to use i18n

## 6. Testing & Validation
- [ ] 6.1 Test language toggle functionality across all migrated components
- [ ] 6.2 Verify no hardcoded text remains in migrated files (visual inspection)
- [ ] 6.3 Test Vietnamese translations for accuracy and naturalness
- [ ] 6.4 Test English translations for clarity and consistency
- [ ] 6.5 Verify responsive behavior (mobile/desktop) for both languages
- [ ] 6.6 Test edge cases (long text, missing keys, fallback behavior)

## 7. Documentation
- [ ] 7.1 Update component documentation with i18n usage examples
- [ ] 7.2 Document translation key naming conventions
- [ ] 7.3 Add guidelines for future developers on adding new UI text
