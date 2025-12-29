# Project Dashboard UI - Spec Delta

## MODIFIED Requirements

### Requirement: TopViralPosts Display

The TopViralPosts component SHALL display high-impact posts with accurate data visualization and interactive elements.

#### Scenario: Render viral posts table

**WHEN** TopViralPosts component renders
**THEN** displays table with columns: #, Content, Platform, Impact Score, Virality, Risk, Engagement, Actions
**AND** Impact Score column shows progress bar with value 0-100
**AND** progress bar width accurately reflects normalized impact_score
**AND** Risk column displays color-coded badges (red=CRITICAL, orange=HIGH, yellow=MEDIUM, blue=LOW)
**AND** Actions column includes clickable external link button when permalink is available

#### Scenario: Display impact score with progress bar

**GIVEN** a viral post with impact_score = 85
**WHEN** rendering the Impact Score column
**THEN** displays a progress bar filled to 85% width
**AND** shows numeric value "85" next to the bar
**AND** progress bar does not overflow or show values >100
**AND** uses gradient styling (blue to purple)

#### Scenario: Handle external link clicks

**GIVEN** a viral post with a valid permalink
**WHEN** user clicks the ExternalLink button
**THEN** opens the permalink URL in a new browser tab
**AND** button shows enabled state with hover effects
**AND** click event does not propagate to row selection

#### Scenario: Handle missing permalinks

**GIVEN** a viral post without a permalink
**WHEN** rendering the Actions column
**THEN** ExternalLink button appears disabled (grayed out)
**AND** button is not clickable
**AND** shows tooltip "Link not available" on hover

#### Scenario: Display correct risk levels

**GIVEN** viral posts with varying impact scores
**WHEN** rendering the Risk column
**THEN** each post shows the correct risk badge based on its risk_level
**AND** CRITICAL posts (impact >= 80) show red badge
**AND** HIGH posts (impact >= 60) show orange badge
**AND** MEDIUM posts (impact >= 40) show yellow badge
**AND** LOW posts (impact < 40) show blue badge
**AND** risk filter correctly filters posts by displayed risk levels

## ADDED Requirements

### Requirement: Permalink URL Handling

The TopViralPosts component SHALL support clickable permalink URLs for navigating to source posts.

#### Scenario: Open post in new tab

**GIVEN** user views the viral posts table
**WHEN** clicking the ExternalLink icon for a post with permalink
**THEN** opens the post URL in a new browser tab
**AND** preserves current dashboard state
**AND** uses target="_blank" with rel="noopener noreferrer" for security

#### Scenario: Disabled state for missing links

**GIVEN** a post without a permalink
**WHEN** rendering the ExternalLink button
**THEN** button shows disabled visual state
**AND** cursor shows not-allowed on hover
**AND** click has no effect
