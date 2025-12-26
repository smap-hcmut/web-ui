# Internationalization Capability

## ADDED Requirements

### Requirement: Complete UI Text Internationalization

All user-facing text in the application SHALL be internationalized using the next-i18next framework, supporting English (en) and Vietnamese (vi) languages.

#### Scenario: User switches language in navigation bar

- **WHEN** a user clicks the language toggle in the navigation bar
- **THEN** all text throughout the application SHALL immediately update to the selected language
- **AND** the selected language SHALL persist across page navigation
- **AND** no hardcoded text SHALL remain visible in the previous language

#### Scenario: User views dashboard with Vietnamese language

- **WHEN** a user selects Vietnamese language
- **THEN** all dashboard components SHALL display Vietnamese translations
- **AND** status messages, error messages, and loading states SHALL display in Vietnamese
- **AND** chart labels, tooltips, and time range options SHALL display in Vietnamese
- **AND** processing step descriptions SHALL display in Vietnamese

#### Scenario: User views authentication pages with English language

- **WHEN** a user selects English language
- **THEN** all authentication pages (login, register, verify-otp) SHALL display English text
- **AND** form labels, placeholders, and validation messages SHALL display in English
- **AND** button text and help text SHALL display in English

#### Scenario: Developer adds new UI text

- **WHEN** a developer adds new user-facing text to a component
- **THEN** the text SHALL be added to both English and Vietnamese translation files
- **AND** the component SHALL use the `useTranslation` hook to access the text
- **AND** the text SHALL NOT be hardcoded in the component JSX

### Requirement: Translation Key Structure

Translation keys SHALL follow a hierarchical namespace structure organized by feature area to ensure maintainability and prevent key collisions.

#### Scenario: Adding translation keys for dashboard features

- **WHEN** a developer adds translations for dashboard components
- **THEN** keys SHALL be namespaced under `dashboard.*`
- **AND** sub-features SHALL use nested keys (e.g., `dashboard.header.*`, `dashboard.processing.*`, `dashboard.charts.*`)
- **AND** the same structure SHALL exist in both en and vi translation files

#### Scenario: Adding translation keys for common UI elements

- **WHEN** a developer adds translations for reusable UI elements
- **THEN** keys SHALL be namespaced under `common.*`
- **AND** buttons SHALL use `common.buttons.*`
- **AND** loading states SHALL use `common.loading.*`
- **AND** error messages SHALL use `common.errors.*`

#### Scenario: Finding translation keys

- **WHEN** a developer needs to find an existing translation
- **THEN** the namespace structure SHALL make the location predictable
- **AND** related translations SHALL be grouped together in the same namespace

### Requirement: Vietnamese Translation Quality

Vietnamese translations SHALL be meaning-based rather than literal word-by-word translations, maintaining natural Vietnamese language flow while preserving technical terminology appropriately.

#### Scenario: Translating technical UI text

- **WHEN** translating UI text containing technical terms
- **THEN** widely-recognized English technical terms SHALL remain in English (e.g., Dashboard, API, AI, ROI)
- **AND** the surrounding Vietnamese text SHALL flow naturally with these terms
- **AND** the translation SHALL be contextually appropriate for the UI element

#### Scenario: Translating action buttons

- **WHEN** translating button text and calls-to-action
- **THEN** Vietnamese translations SHALL use natural, concise phrasing
- **AND** the translated text SHALL fit within UI constraints without overflow
- **AND** the meaning and urgency SHALL be preserved (e.g., "Try Again" → "Thử lại", not "Cố gắng lại")

#### Scenario: Translating status and error messages

- **WHEN** translating status updates and error messages
- **THEN** Vietnamese translations SHALL maintain the appropriate tone (professional, helpful)
- **AND** technical details SHALL remain clear and unambiguous
- **AND** the translation SHALL follow existing patterns in the codebase

### Requirement: Brand Name Consistency

Company branding, proper nouns, and universal identifiers SHALL remain in their original form and not be translated.

#### Scenario: Displaying company branding

- **WHEN** the application displays company names
- **THEN** brand names SHALL remain as "SMAP SOLUTION" and "INT SOLUTION" regardless of selected language
- **AND** these SHALL be hardcoded, not retrieved from translation files

#### Scenario: Displaying contact information

- **WHEN** the application displays contact information
- **THEN** email addresses SHALL remain in their original form (e.g., contact@smapsolution.com)
- **AND** trust badge company names SHALL remain as proper nouns (VNEXPRESS, CAFEBIZ, TECHCOMBANK)

#### Scenario: Displaying numerical identifiers

- **WHEN** the application displays numbers, counts, or IDs
- **THEN** numeric values SHALL remain unchanged regardless of language
- **AND** only descriptive text around numbers SHALL be translated

### Requirement: Translation File Completeness

English and Vietnamese translation files SHALL maintain structural parity, containing matching keys with appropriate translations in each language.

#### Scenario: Adding new translation keys

- **WHEN** a developer adds a new translation key to the English file
- **THEN** a corresponding key with Vietnamese translation SHALL be added to the Vietnamese file
- **AND** both files SHALL maintain the same nested structure
- **AND** validation SHALL catch missing keys during development

#### Scenario: Detecting missing translations

- **WHEN** a translation key is missing in one language file
- **THEN** the application SHALL display a warning in development mode
- **AND** the application SHALL fall back to the English translation
- **AND** the missing key SHALL be logged for developer attention

#### Scenario: Validating translation files

- **WHEN** translation files are validated
- **THEN** both files SHALL have matching key structures
- **AND** no keys SHALL be present in one file but missing in the other
- **AND** validation SHALL be performed before deployment

### Requirement: Component i18n Integration

All React components with user-facing text SHALL integrate the next-i18next translation hook following consistent patterns.

#### Scenario: Migrating component to use i18n

- **WHEN** a component is migrated to use internationalization
- **THEN** the component SHALL import and use the `useTranslation` hook from 'next-i18next'
- **AND** all hardcoded strings SHALL be replaced with `t('key')` calls
- **AND** company branding and proper nouns SHALL remain hardcoded
- **AND** the component SHALL render correctly in both English and Vietnamese

#### Scenario: Component receives translation updates

- **WHEN** translation files are updated
- **THEN** components using those translations SHALL reflect the changes without code modifications
- **AND** no component recompilation SHALL be required for translation updates
- **AND** changes SHALL be visible after page reload in development

#### Scenario: Component handles missing translation

- **WHEN** a component requests a translation key that doesn't exist
- **THEN** next-i18next SHALL return the key name as fallback
- **AND** a development warning SHALL be logged
- **AND** the application SHALL continue to function without crashing
