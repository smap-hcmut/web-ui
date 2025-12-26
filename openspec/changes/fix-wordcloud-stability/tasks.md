# Implementation Tasks

## 1. Dependency Management
- [x] 1.1 Install react-wordcloud and d3-cloud dependencies
- [x] 1.2 Remove chartjs-chart-wordcloud from package.json
- [x] 1.3 Verify no other components use chartjs-chart-wordcloud

## 2. TopicCloud Component Refactor
- [x] 2.1 Remove Chart.js imports and WordCloudController registration
- [x] 2.2 Import ReactWordcloud from react-wordcloud
- [x] 2.3 Transform KeywordData to react-wordcloud's Word format
- [x] 2.4 Configure deterministic layout options (deterministic: true, spiral: 'rectangular')
- [x] 2.5 Implement aspect-based color callback function
- [x] 2.6 Set font size calculation based on count (min: 12px, max: 60px)
- [x] 2.7 Add proper TypeScript types for Word objects

## 3. Tooltip and Interaction
- [x] 3.1 Implement custom tooltip using react-wordcloud's callbacks
- [x] 3.2 Display keyword, aspect, sentiment, count in tooltip
- [x] 3.3 Preserve onClick handler for topic selection
- [x] 3.4 Add hover effects for better UX

## 4. Layout Stability
- [x] 4.1 Configure deterministic seed for consistent positioning
- [x] 4.2 Set padding and rotation options (rotation: 0 for horizontal-only text)
- [x] 4.3 Remove canvas key-based force re-render logic
- [x] 4.4 Add useMemo for word data to prevent unnecessary recalculations

## 5. Aspect Legend and Top Topics List
- [x] 5.1 Verify aspect legend still renders correctly with new implementation
- [x] 5.2 Ensure "Top Trending Keywords" list below cloud remains functional
- [x] 5.3 Maintain existing aspect color constants (ASPECT_COLORS)

## 6. Testing and Validation
- [x] 6.1 Test with empty keywords array (loading state)
- [x] 6.2 Test with 20 keywords from API
- [x] 6.3 Verify keywords maintain position across renders
- [x] 6.4 Verify font sizes scale proportionally to counts
- [x] 6.5 Verify aspect colors display correctly
- [x] 6.6 Test onClick navigation to topic details
- [x] 6.7 Test tooltip display on hover

## 7. Performance Optimization
- [x] 7.1 Remove setTimeout-based render delays
- [x] 7.2 Ensure component only re-renders when dashboardKeywords changes
- [x] 7.3 Verify no memory leaks from old chart.js cleanup logic

## 8. Cleanup
- [x] 8.1 Remove unused chart.js chart reference (chartRef.current)
- [x] 8.2 Remove unused canvasKey state
- [x] 8.3 Remove timeoutRef cleanup logic
- [x] 8.4 Update component comments and documentation
