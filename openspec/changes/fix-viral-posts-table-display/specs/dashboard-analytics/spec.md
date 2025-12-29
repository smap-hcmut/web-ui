# Dashboard Analytics - Spec Delta

## MODIFIED Requirements

### Requirement: Viral Posts Identification

The system SHALL identify viral posts based on impact score:
- Filter posts with `impact_score > 0.5` OR `is_viral = true`
- Sort by `impact_score` descending
- Include risk level, engagement, reach metrics, and permalink
- **Normalize impact_score to 0-100 range regardless of API format**
- **Provide fallback risk level calculation when API risk_level is missing or invalid**

#### Scenario: Filter viral posts

**GIVEN** 1000 posts with varying impact scores
**WHEN** the system filters viral posts
**THEN** returns only posts with `impact_score > 0.5` or `is_viral = true`
**AND** sorted by impact_score (highest first)
**AND** limited to top 10 viral posts
**AND** each post includes a valid permalink for navigation

#### Scenario: Normalize impact scores from different API formats

**GIVEN** API returns impact_score in different formats (0-1 decimal, 0-100 integer, or >100 values)
**WHEN** extractViralPosts transforms the data
**THEN** impact_score is normalized to 0-100 range
**AND** values >100 are scaled down (e.g., 10000 → 100)
**AND** values 0-1 are scaled up (e.g., 0.85 → 85)
**AND** final value is clamped between 0-100

#### Scenario: Map risk levels correctly

**GIVEN** a viral post with `risk_level = "HIGH"`
**WHEN** the post is displayed in TopViralPosts component
**THEN** the risk badge shows correct color (orange for HIGH, red for CRITICAL)
**AND** impact score is displayed as percentage (0-100)
**AND** risk level is calculated from impact_score if API risk_level is missing

#### Scenario: Fallback risk calculation

**GIVEN** a post with `impact_score = 85` but no `risk_level` from API
**WHEN** extractViralPosts processes the post
**THEN** risk_level is set to "CRITICAL" (since impact_score >= 80)
**AND** the fallback calculation follows the standard thresholds:
  - CRITICAL: impact_score >= 80
  - HIGH: impact_score >= 60
  - MEDIUM: impact_score >= 40
  - LOW: impact_score < 40

## ADDED Requirements

### Requirement: Viral Post Permalink Support

The system SHALL include permalink URLs for all viral posts to enable direct navigation to source content.

#### Scenario: Include permalink in viral posts data

**GIVEN** API returns posts with `permalink` field
**WHEN** extractViralPosts transforms the data
**THEN** each ViralPostData object includes the `permalink` field
**AND** permalink is a valid URL to the social media post
**AND** permalink supports all platforms (TikTok, YouTube, Instagram, Facebook)

#### Scenario: Handle missing permalinks gracefully

**GIVEN** a post without a `permalink` field
**WHEN** extractViralPosts processes the post
**THEN** the post is included with `permalink = null` or empty string
**AND** UI displays disabled link state for posts without permalinks

### Requirement: Viral Post Data Validation

The system SHALL validate and sanitize viral posts data to prevent display corruption.

#### Scenario: Validate impact score range

**GIVEN** transformed viral post data
**WHEN** data validation runs
**THEN** all impact_score values are between 0-100
**AND** any out-of-range values are clamped
**AND** NaN or null values default to 0

#### Scenario: Validate required fields

**GIVEN** a viral post object
**WHEN** validation checks required fields
**THEN** ensures `id`, `title`, `platform`, `impact_score`, `risk` are present
**AND** provides default values for missing optional fields (engagement=0, reach=0)
**AND** logs warnings for posts with missing required data
