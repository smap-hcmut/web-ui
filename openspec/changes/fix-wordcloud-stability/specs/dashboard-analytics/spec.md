# dashboard-analytics Specification Delta

## MODIFIED Requirements

### Requirement: TopicCloud Aspect-Based Visualization

The system SHALL visualize keywords in TopicCloud with color coding based on aspect classification using a stable, deterministic layout algorithm:
- **Library**: Uses react-wordcloud with d3-cloud for deterministic positioning
- **PRICE** keywords: Orange (#f59e0b) - keywords about pricing, cost
- **PERFORMANCE** keywords: Blue (#3b82f6) - keywords about performance, speed
- **DESIGN** keywords: Purple (#8b5cf6) - keywords about design, aesthetics
- **SERVICE** keywords: Green (#10b981) - keywords about service, support
- **Uncategorized**: Gray (#6b7280) - keywords without aspect
- **Positioning**: Keywords with same text and count always appear at same location (deterministic)
- **Sizing**: Font size scales proportionally with count value (range: 12px-60px)
- **Rotation**: All keywords displayed horizontally (rotation: 0) for readability

#### Scenario: Display keyword with aspect color and stable position

**GIVEN** keyword "tiền" with aspect "PRICE" and count 4
**WHEN** the TopicCloud renders multiple times
**THEN** the keyword is displayed in orange color (#f59e0b)
**AND** the keyword appears at the same X,Y coordinates across renders
**AND** font size reflects count value (larger count = bigger font)
**AND** tooltip shows "tiền - PRICE aspect, Count: 4"

#### Scenario: Mix of different aspects in cloud with consistent layout

**GIVEN** keywords with aspects: "tiền" (PRICE, count=4), "lag" (PERFORMANCE, count=3), "màu" (DESIGN, count=2), "hỗ trợ" (SERVICE, count=1)
**WHEN** the TopicCloud renders
**THEN** each keyword displays in its respective aspect color
**AND** keywords maintain consistent positions between renders
**AND** font sizes decrease proportionally: "tiền" > "lag" > "màu" > "hỗ trợ"
**AND** color legend shows aspect meanings

#### Scenario: Data update triggers smooth transition

**GIVEN** existing WordCloud with 20 keywords
**WHEN** API updates with new keyword counts (e.g., "tiền" changes from count=4 to count=8)
**THEN** the WordCloud re-renders with updated font sizes
**AND** existing keywords maintain their general positions (deterministic seed)
**AND** component does not flicker or jump unexpectedly

---

## ADDED Requirements

### Requirement: Deterministic WordCloud Layout

The system SHALL implement a deterministic layout algorithm for the WordCloud visualization to ensure positional stability:
- Use `deterministic: true` option in react-wordcloud configuration
- Apply consistent seed value based on project ID or fixed constant
- Configure `spiral: 'rectangular'` for predictable keyword placement
- Set `padding: 2` to prevent overlap without excessive spacing
- Disable text rotation (`rotations: 0`) for horizontal-only display
- Implement memoization to prevent unnecessary recalculations

#### Scenario: Same keywords always appear at same positions

**GIVEN** keyword dataset with ["tiền", "lag", "màu", "hỗ trợ", "chất lượng"]
**WHEN** the component renders twice without data changes
**THEN** each keyword appears at identical X,Y coordinates in both renders
**AND** no visual shifting or repositioning occurs
**AND** layout uses same spiral pattern from center outward

#### Scenario: Component re-renders without data change

**GIVEN** TopicCloud component is mounted with 20 keywords
**WHEN** parent component re-renders (e.g., sidebar toggle)
**THEN** the WordCloud does not recalculate layout
**AND** keywords remain in exact same positions
**AND** no canvas redraw or flicker occurs

#### Scenario: Project change triggers new layout

**GIVEN** user switches from Project A to Project B
**WHEN** new keywords load for Project B
**THEN** the WordCloud calculates new deterministic layout for Project B data
**AND** layout is stable for Project B across subsequent renders
**AND** returning to Project A shows original layout (if cached)

---

### Requirement: Proportional Font Sizing

The system SHALL scale keyword font sizes proportionally based on their count values:
- Minimum font size: 12px (for keywords with count=1 or lowest count)
- Maximum font size: 60px (for keywords with highest count in dataset)
- Linear scaling: fontSize = minSize + (count - minCount) / (maxCount - minCount) × (maxSize - minSize)
- Font family: 'Inter, system-ui, -apple-system, sans-serif' for consistency with dashboard

#### Scenario: Font size scales with count values

**GIVEN** keywords with counts: "tiền" (10), "lag" (5), "màu" (2)
**WHEN** the WordCloud calculates font sizes
**THEN** "tiền" has fontSize ≈ 60px (highest count)
**AND** "lag" has fontSize ≈ 36px (middle count)
**AND** "màu" has fontSize ≈ 12px (lowest count)
**AND** size differences are visually clear

#### Scenario: Single keyword edge case

**GIVEN** only one keyword "tiền" with count=4
**WHEN** the WordCloud renders
**THEN** the keyword displays at medium font size (36px, middle of range)
**AND** does not display at min or max extremes

#### Scenario: All keywords have same count

**GIVEN** keywords with equal counts: "tiền" (5), "lag" (5), "màu" (5)
**WHEN** the WordCloud renders
**THEN** all keywords display at the same font size (36px, middle of range)
**AND** layout prioritizes alphabetical or aspect-based ordering

---

### Requirement: Interactive Tooltip on Hover

The system SHALL display an interactive tooltip when user hovers over a keyword in the WordCloud:
- **Trigger**: Mouse hover or touch on keyword
- **Content**: Keyword text, aspect classification, count, sentiment score, trend direction
- **Position**: Near cursor, positioned to avoid overflow
- **Styling**: Consistent with dashboard tooltip theme (dark background, white text)
- **Behavior**: Appears on hover, disappears on mouse leave

#### Scenario: Hover displays detailed keyword information

**GIVEN** keyword "tiền" with PRICE aspect, count=4, sentiment=1.0
**WHEN** user hovers over "tiền" in WordCloud
**THEN** tooltip appears showing:
- "tiền"
- "Aspect: PRICE"
- "Sentiment: +1.00"
- "Count: 4"
- "Mentions: 4"
- "Click to view details"

#### Scenario: Tooltip positioning avoids overflow

**GIVEN** keyword "tiền" positioned near right edge of cloud container
**WHEN** user hovers over "tiền"
**THEN** tooltip appears to the left of keyword (not overflowing container)
**AND** tooltip is fully visible within cloud bounds

#### Scenario: Mobile touch interaction

**GIVEN** user on mobile device
**WHEN** user taps keyword in WordCloud
**THEN** tooltip appears on tap
**AND** remains visible for 2 seconds or until user taps elsewhere
**AND** onClick handler also triggers for navigation

---

### Requirement: Performance Optimization for WordCloud Rendering

The system SHALL optimize WordCloud rendering to minimize unnecessary recalculations:
- Use `useMemo` to memoize word array based on `dashboardKeywords` dependency
- Prevent re-render when unrelated context values change (e.g., sidebar state)
- Remove setTimeout-based render delays from legacy Chart.js implementation
- Implement shallow comparison for keyword data equality check
- Maximum render time: < 100ms for 20 keywords, < 300ms for 50 keywords

#### Scenario: Memoization prevents unnecessary recalculations

**GIVEN** TopicCloud component with memoized word data
**WHEN** parent component re-renders due to sidebar toggle
**THEN** word data array is not recalculated
**AND** WordCloud component does not re-render
**AND** layout remains stable

#### Scenario: Data change triggers single re-render

**GIVEN** keywords update from API revalidation
**WHEN** `dashboardKeywords` context value changes
**THEN** component re-renders exactly once
**AND** new layout calculated with updated data
**AND** no additional renders occur

#### Scenario: Render performance meets targets

**GIVEN** dataset of 20 keywords from API
**WHEN** WordCloud component mounts for first time
**THEN** layout calculation completes in < 100ms
**AND** visual rendering (paint) completes in < 50ms
**AND** total time-to-interactive < 150ms

---

### Requirement: Click Navigation to Topic Details

The system SHALL preserve click-to-navigate functionality from legacy implementation:
- User can click any keyword in WordCloud to navigate to topic details
- Clicked keyword passed to `onTopicClick` callback with full data
- Callback receives `TopicData` object with text, value, sentiment, aspect
- Click handler works on both desktop (mouse) and mobile (touch)

#### Scenario: Click keyword navigates to details

**GIVEN** user viewing TopicCloud with keyword "tiền" (PRICE, count=4, sentiment=1.0)
**WHEN** user clicks on "tiền" in the cloud
**THEN** `onTopicClick` callback fires with topic object:
```typescript
{
  text: "tiền",
  value: 4,
  sentiment: 1.0,
  mentions: 4,
  trend: 'stable',
  aspect: 'PRICE'
}
```
**AND** dashboard navigates to topic detail view or modal

#### Scenario: Mobile tap registers as click

**GIVEN** user on mobile device viewing TopicCloud
**WHEN** user taps keyword "lag"
**THEN** tap registers as click event
**AND** `onTopicClick` callback fires
**AND** navigation occurs immediately

---

### Requirement: Fallback Rendering for Empty or Loading States

The system SHALL display appropriate states when keyword data is unavailable:
- **Loading state**: Show skeleton placeholder while fetching keywords
- **Empty state**: Display message when no keywords available (new project)
- **Error state**: Show error message with retry when API fails
- Maintain container dimensions to prevent layout shifts

#### Scenario: Loading state while fetching keywords

**GIVEN** dashboard loads for first time with no cached keywords
**WHEN** TopicCloud component mounts
**THEN** displays loading skeleton (pulsing rectangles mimicking word shapes)
**AND** maintains WordCloud container height (320px)
**AND** shows "Loading trending keywords..." message

#### Scenario: Empty state for new project

**GIVEN** project has no analyzed posts yet (keywords array is empty)
**WHEN** TopicCloud component receives empty data
**THEN** displays empty state message: "No trending keywords yet. Start analyzing posts to see insights."
**AND** maintains container dimensions
**AND** does not show error state

#### Scenario: Error state with retry

**GIVEN** top-keywords API fails with 500 error
**WHEN** TopicCloud attempts to render
**THEN** displays error message: "Failed to load trending keywords"
**AND** shows retry button
**AND** clicking retry triggers `refreshKeywords()` from context
