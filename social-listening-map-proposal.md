# Social Listening Map — UX/UI Redesign Proposal

> **Document type:** Implementation prompt for AI coding agent
> **Tech stack:** Next.js 14+ (App Router) · React 18+ · TypeScript · Tailwind CSS · Lucide Icons
> **Scope:** Redesign the MAP view of a social listening platform
> **Priority order:** Wow factor → Insight nhanh → Drill-down → Real-time

---

## 1. Context & Current State

### 1.1 Product overview

Hệ thống social listening cho phép người dùng theo dõi mentions, engagement, và sentiment của các bài viết trên mạng xã hội. Giao diện chính là một **MAP view** hiển thị dữ liệu dưới dạng **bubble map** có thể drill-down theo hierarchy:

```
Campaign → Project → Keyword → Post → Comment
```

### 1.2 Target users (tất cả đều là primary)

| Persona | Nhu cầu chính | Hành vi |
|---------|--------------|---------|
| Marketing Manager | Theo dõi campaign performance | Cần overview nhanh, focus sentiment & reach |
| C-level / Leader | Big picture, so sánh campaigns | Scan 5-10 giây, cần thấy ngay "điều gì đang nổi bật" |
| Analyst | Đào sâu dữ liệu, tìm patterns | Drill-down nhiều, cần keyboard nav, export data |
| Customer Support | Phát hiện crisis, phản hồi tiêu cực | Cần alert nhanh, focus vào negative sentiment |

### 1.3 Current problems

1. **Bubbles chỉ encode 1 dimension** — size = mentions. Sentiment, engagement, trend direction đều ẩn sau hover
2. **Không gian trống quá nhiều** — đặc biệt ở level sâu (keyword, comment), bubbles rải rác trên nền đen
3. **Content area phía dưới luôn trống** — chiếm ~40% viewport nhưng không hiển thị gì cho đến khi user thực hiện action
4. **Thiếu dimension thời gian** — map hoàn toàn static, không truyền tải được momentum hay trending
5. **Drill-down transition bị abrupt** — click bubble → hard cut sang view mới, mất context
6. **Một layout cho mọi persona** — không có cách tùy biến view theo nhu cầu từng nhóm user

### 1.4 Current navigation

- Top nav: `SMAP | MAP | Platforms | Insights | 🔍 | 🔴 LIVE`
- Breadcrumb: `All → Campaign name → Project name → Keyword → Post title`
- Bottom ticker: Live feed các bài viết mới nhất với sentiment tag (neutral/negative/positive)
- Map controls: Zoom in/out, fullscreen, search

---

## 2. Design System & Visual Language

### 2.1 Color palette

Nền tối (dark theme) là primary. Tất cả components phải hoạt động trên dark background.

```typescript
const colors = {
  // Background layers
  bg: {
    primary: '#0A0A0F',      // Main background
    secondary: '#12121A',    // Card/panel background
    tertiary: '#1A1A25',     // Elevated surfaces
    hover: '#22222E',        // Interactive hover states
  },

  // Sentiment spectrum (critical — dùng xuyên suốt)
  sentiment: {
    positive: '#3ECFA0',     // Green — tích cực
    neutral: '#EF9F27',      // Amber — trung lập
    negative: '#E24B4A',     // Red — tiêu cực
    mixed: '#A78BFA',        // Purple — hỗn hợp
  },

  // Accent
  accent: {
    primary: '#3ECFA0',      // Primary interactive (teal-green)
    secondary: '#60A5FA',    // Secondary (blue)
    muted: '#6B7280',        // Disabled/inactive
  },

  // Text
  text: {
    primary: '#F1F1F3',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#0A0A0F',
  },

  // Borders
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.10)',
    emphasis: 'rgba(255,255,255,0.20)',
  },
};
```

### 2.2 Typography

```typescript
const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  sizes: {
    xs: '11px',      // Metadata, badges
    sm: '12px',      // Subtitles, descriptions
    base: '13px',    // Body text
    md: '14px',      // Labels, card titles
    lg: '16px',      // Section headers
    xl: '20px',      // Metric values
    '2xl': '24px',   // Large metric values
  },
};
```

### 2.3 Motion principles

```typescript
const motion = {
  // Spring configs (framer-motion)
  spring: {
    gentle: { type: 'spring', stiffness: 120, damping: 20 },
    snappy: { type: 'spring', stiffness: 200, damping: 25 },
    bouncy: { type: 'spring', stiffness: 300, damping: 20 },
  },
  // Duration configs
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.35,
    slow: 0.6,
    zoom: 0.8,       // Drill-down zoom transition
  },
  // Easing
  easing: {
    smooth: [0.25, 0.1, 0.25, 1],
    decelerate: [0, 0, 0.2, 1],
  },
};
```

---

## 3. Implementation Phases

---

### PHASE 1: "Make It Breathe" — Multi-Dimension Bubbles

> **Goal:** Biến static bubbles thành living entities encode 5 dimensions
> **Effort:** 1-2 tuần
> **Impact:** ★★★★★ (wow factor cao nhất)

#### 3.1.1 Bubble anatomy (new)

Mỗi bubble giờ sẽ encode 5 dimensions thay vì 1:

```
┌─────────────────────────────────────────┐
│  DIMENSION        │  VISUAL ENCODING    │
├───────────────────┼─────────────────────┤
│  Mentions (vol.)  │  Bubble SIZE        │
│  Sentiment        │  Ring COLOR         │
│  Trend direction  │  Arrow icon (↑↓→)   │
│  Mention velocity │  Pulse SPEED        │
│  7-day trend      │  Sparkline          │
└─────────────────────────────────────────┘
```

#### 3.1.2 Component: `<BubbleNode />`

```typescript
interface BubbleNodeProps {
  id: string;
  label: string;
  mentions: number;
  sentiment: number;           // 0-100 (0 = all negative, 100 = all positive)
  engagement: number;
  mentionVelocity: number;     // mentions/hour (recent)
  trendData: number[];         // 7 data points for sparkline
  trendDirection: 'up' | 'down' | 'stable';
  level: 'campaign' | 'project' | 'keyword' | 'post' | 'comment';
  isCrisis: boolean;           // sentiment drop > 15% in 2h
  x: number;
  y: number;
  radius: number;              // Calculated from mentions
}
```

#### 3.1.3 Sentiment ring rendering

Ring xung quanh bubble phản ánh sentiment ratio bằng conic-gradient hoặc SVG stroke:

```typescript
// Tính toán sentiment ring
function getSentimentRing(sentiment: number) {
  // sentiment: 0-100
  if (sentiment >= 70) return { color: colors.sentiment.positive, label: 'Positive' };
  if (sentiment >= 40) return { color: colors.sentiment.neutral, label: 'Mixed' };
  return { color: colors.sentiment.negative, label: 'Negative' };
}

// SVG implementation
// Ring stroke color = sentiment color
// Ring stroke width = 3px (campaign), 2.5px (project), 2px (keyword), 1.5px (post/comment)
// Ring opacity = 0.7 (normal), 1.0 (hovered/selected)
```

Nếu cần chi tiết hơn, dùng **conic gradient ring** chia thành segments:

```
// Ví dụ: 60% positive, 15% neutral, 25% negative
// → Ring: 60% xanh lá + 15% vàng + 25% đỏ (theo chiều kim đồng hồ từ 12h)
```

**Implementation (SVG approach):**

```tsx
<svg>
  {/* Background circle (subtle fill) */}
  <circle cx={x} cy={y} r={radius - 3} fill={sentimentColor} opacity={0.05} />

  {/* Sentiment ring */}
  <circle
    cx={x} cy={y} r={radius}
    fill="none"
    stroke={sentimentColor}
    strokeWidth={ringWidth}
    opacity={0.7}
  />

  {/* Pulse rings (animated) */}
  <circle cx={x} cy={y} r={radius} fill={sentimentColor} opacity={0}>
    <animate
      attributeName="r"
      values={`${radius};${radius + 15};${radius}`}
      dur={`${pulseSpeed}s`}     // 1.2s (crisis) → 3s (normal) → 5s (quiet)
      repeatCount="indefinite"
    />
    <animate
      attributeName="opacity"
      values="0.12;0;0.12"
      dur={`${pulseSpeed}s`}
      repeatCount="indefinite"
    />
  </circle>
</svg>
```

#### 3.1.4 Pulse speed calculation

```typescript
function getPulseSpeed(mentionVelocity: number, isCrisis: boolean): number {
  // mentionVelocity = mentions per hour (recent 2h window)
  if (isCrisis) return 1.2;                           // Fast pulse — crisis alert
  if (mentionVelocity > 100) return 1.5;              // Very active
  if (mentionVelocity > 50) return 2.0;               // Active
  if (mentionVelocity > 20) return 3.0;               // Normal
  if (mentionVelocity > 5) return 4.0;                // Quiet
  return 5.0;                                          // Very quiet — slow breathing
}
```

#### 3.1.5 Sparkline inside bubble

Hiển thị trend 7 ngày dưới label, chỉ render khi bubble radius > 35px (đủ lớn để đọc):

```tsx
// Sparkline: 7 data points, width = radius * 0.7, height = 12px
// Stroke color = sentiment color, stroke width = 1.5px
// Vị trí: centered horizontally, dưới mention count 8px

{radius > 35 && (
  <polyline
    points={sparklinePoints}          // "84,130 90,128 96,132 102,126 108,124 114,120 120,118"
    fill="none"
    stroke={sentimentColor}
    strokeWidth={1.5}
    strokeLinecap="round"
    opacity={0.6}
  />
)}
```

#### 3.1.6 Trend direction indicator

```tsx
// Trend arrow: small icon ở left side của bubble
// ↑ (up) = xanh lá, ↓ (down) = đỏ, → (stable) = xám
// Chỉ hiển thị khi radius > 28px

{radius > 28 && (
  <g transform={`translate(${x - radius + 8}, ${y - 4})`}>
    {trendDirection === 'up' && (
      <path d="M0 8L4 0L8 8Z" fill={colors.sentiment.positive} opacity={0.7} />
    )}
    {trendDirection === 'down' && (
      <path d="M0 0L4 8L8 0Z" fill={colors.sentiment.negative} opacity={0.7} />
    )}
    {trendDirection === 'stable' && (
      <rect x={0} y={3} width={8} height={2} rx={1} fill={colors.accent.muted} opacity={0.5} />
    )}
  </g>
)}
```

#### 3.1.7 Crisis mode

Khi `isCrisis === true`:

1. Ring color → `colors.sentiment.negative` (#E24B4A)
2. Pulse speed → 1.2s (nhanh, urgent)
3. Thêm second pulse ring (staggered 0.3s) tạo ripple effect
4. Thêm warning icon "!" phía trên label
5. Subtle red glow: `filter: drop-shadow(0 0 8px rgba(226, 75, 74, 0.3))`
6. Bubble z-index tăng lên trên cùng

```typescript
// Crisis detection rule:
const isCrisis = (
  sentimentDropPercent > 15 &&         // Sentiment giảm > 15%
  timeWindowHours <= 2                  // Trong 2 giờ gần nhất
) || (
  sentiment < 30 &&                     // Sentiment rất thấp
  mentionVelocity > 50                  // Và đang lan nhanh
);
```

#### 3.1.8 Bubble size scale

```typescript
// Min radius: 20px (post/comment level)
// Max radius: 80px (campaign level with highest mentions)
// Scale: sqrt để tránh bubble quá lớn dominate

function calculateRadius(
  mentions: number,
  minMentions: number,
  maxMentions: number,
  level: string
): number {
  const levelScale = {
    campaign: { min: 40, max: 80 },
    project: { min: 30, max: 60 },
    keyword: { min: 22, max: 45 },
    post: { min: 18, max: 35 },
    comment: { min: 14, max: 25 },
  };

  const { min, max } = levelScale[level];
  const normalized = Math.sqrt(
    (mentions - minMentions) / (maxMentions - minMentions)
  );
  return min + normalized * (max - min);
}
```

---

### PHASE 2: "Always-On Context Panel"

> **Goal:** Biến content area trống thành smart panel luôn hiển thị insight
> **Effort:** 1 tuần
> **Impact:** ★★★★☆

#### 3.2.1 Layout structure

```
┌──────────────────────────────────────────────────┐
│  Top Nav: SMAP | MAP | Platforms | Insights | 🔴 │
├──────────────────────────────────────────────────┤
│                                                  │
│           BUBBLE MAP AREA (~55vh)                │
│                                                  │
│       [Bubbles with new encoding]                │
│                                                  │
├──────────────────────────────────────────────────┤
│  CONTEXT PANEL (~40vh)                           │
│  ┌─────────────┬────────────────────────────┐    │
│  │  Panel tabs │  Summary | Trending |      │    │
│  │             │  Alerts  | Timeline        │    │
│  ├─────────────┴────────────────────────────┤    │
│  │  [Content changes based on selection]    │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
├──────────────────────────────────────────────────┤
│  LIVE TICKER (bottom bar)                        │
└──────────────────────────────────────────────────┘
```

#### 3.2.2 Panel states

**State 1: No selection (default overview)**

Khi chưa chọn bubble nào, panel hiển thị overview của tất cả campaigns:

```typescript
interface OverviewPanelData {
  totalMentions: number;
  totalEngagement: number;
  avgSentiment: number;
  activeCrises: number;

  mentionsTrend: TimeSeriesData[];     // 7 ngày, dùng cho area chart
  topTrendingKeywords: {
    keyword: string;
    mentions: number;
    growth: number;                     // % change vs yesterday
    sentiment: number;
  }[];

  recentAlerts: {
    type: 'crisis' | 'spike' | 'goal' | 'anomaly';
    title: string;
    description: string;
    timestamp: Date;
    severity: 'high' | 'medium' | 'low';
    relatedEntity: string;              // Campaign/project/keyword name
  }[];
}
```

**Layout cho overview state:**

```
┌────────────────────────────────────────────────────────────┐
│  Overview — All campaigns              [Summary] [Trending]│
│                                        [Alerts]  [Timeline]│
├──────────┬──────────┬──────────┬──────────┐                │
│ Mentions │ Engagem. │ Avg Sent │ Crises   │                │
│ 140.7K   │ 8.2M     │ 74%      │ 2        │                │
│ +12.3%   │ +5.1%    │ -2.1%    │ ⚠ needs  │                │
├──────────┴──────────┴──────────┴──────────┤                │
│                                                            │
│  ┌─ Mentions trend (7d) ──────┐  ┌─ Recent alerts ──────┐ │
│  │  [Area chart]              │  │  🔴 Sentiment drop    │ │
│  │                            │  │  🟡 Spike detected    │ │
│  │                            │  │  🟢 Goal reached      │ │
│  └────────────────────────────┘  └───────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**State 2: Bubble selected**

Khi user click vào 1 bubble, panel transition sang detail view:

```typescript
interface EntityDetailData {
  // Header
  entityType: 'campaign' | 'project' | 'keyword' | 'post' | 'comment';
  entityName: string;
  description?: string;

  // Metrics
  mentions: number;
  engagement: number;
  sentiment: number;
  reach: number;
  mentionGrowth: number;             // % vs previous period

  // Charts
  mentionsTrend: TimeSeriesData[];   // 30 ngày
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platformDistribution: {
    platform: string;                 // Facebook, TikTok, YouTube, etc.
    mentions: number;
    percentage: number;
  }[];

  // Top content
  topPosts: {
    title: string;
    platform: string;
    engagement: number;
    sentiment: number;
    url: string;
  }[];

  // Children (for drill-down)
  children: {
    name: string;
    mentions: number;
    sentiment: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}
```

**Panel transition animation:**

```typescript
// Khi select bubble:
// 1. Panel header slide-up, old content fade-out (200ms)
// 2. New header slide-in from bottom (300ms, spring)
// 3. Metric cards stagger-in from left to right (delay 50ms mỗi card)
// 4. Charts fade-in + scale from 0.95 (400ms)

// Khi deselect (click empty space):
// 1. Detail content fade-out (200ms)
// 2. Overview content fade-in (300ms)
```

#### 3.2.3 Panel tabs

| Tab | Content | Use case |
|-----|---------|----------|
| **Summary** | Metrics + trend chart + platform pie | Quick overview |
| **Trending** | Top growing keywords/posts + growth chart | Discover what's hot |
| **Alerts** | Timeline of alerts + severity indicator | Crisis monitoring |
| **Timeline** | Chronological list of events/milestones | Historical analysis |

#### 3.2.4 Component: `<ContextPanel />`

```typescript
interface ContextPanelProps {
  selectedEntity: EntityDetailData | null;
  overviewData: OverviewPanelData;
  activeTab: 'summary' | 'trending' | 'alerts' | 'timeline';
  onTabChange: (tab: string) => void;
  onEntityClick: (entityId: string) => void;  // Click child entity in panel → select on map
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}
```

#### 3.2.5 Resizable panel

- Panel có drag handle ở top edge để resize (min: 150px, max: 60vh)
- Double-click handle để toggle collapse/expand
- Collapsed state: chỉ hiện metric cards row (compact, ~60px height)
- State persist trong localStorage

---

### PHASE 3: "Connection Threads & Smart Transitions"

> **Goal:** Thêm relationship visualization + smooth drill-down
> **Effort:** 1-2 tuần
> **Impact:** ★★★★☆

#### 3.3.1 Connection threads giữa bubbles

Hiển thị mối quan hệ giữa các entities bằng animated dashed lines:

```typescript
interface ConnectionThread {
  sourceId: string;
  targetId: string;
  strength: number;              // 0-1 (normalized overlap score)
  type: 'keyword_overlap'        // Chia sẻ keywords
    | 'author_overlap'           // Cùng authors/KOLs
    | 'content_similarity'       // Nội dung tương tự
    | 'mention_co_occurrence';   // Được mention cùng nhau
}
```

**Visual encoding:**

```
Line thickness = strength (0.5px → 2px)
Line opacity   = strength * 0.3 (subtle, không overwhelm)
Line style     = dashed, animated (stroke-dashoffset animation)
Line color     = type-dependent:
  - keyword_overlap      → colors.accent.primary (#3ECFA0)
  - author_overlap       → colors.accent.secondary (#60A5FA)
  - content_similarity   → colors.sentiment.mixed (#A78BFA)
  - mention_co_occurrence → colors.sentiment.neutral (#EF9F27)
```

**Animation:**

```css
/* Flowing dash animation — particles moving along connection */
.connection-thread {
  stroke-dasharray: 4 4;
  animation: flow var(--flow-speed, 1.5s) linear infinite;
}
@keyframes flow {
  to { stroke-dashoffset: -16; }
}
```

**Rendering rules:**

- Chỉ render connections có `strength > 0.3` (tránh visual noise)
- Maximum 15 connections hiển thị cùng lúc (top 15 by strength)
- Khi hover 1 bubble, highlight connections của bubble đó (opacity tăng lên 0.6), fade connections khác
- Toggle connections on/off bằng nút ở map controls
- Ở level campaign: show cross-campaign relationships
- Ở level keyword: show keyword co-occurrence network

#### 3.3.2 Smooth zoom drill-down

Thay vì hard cut khi click vào bubble, dùng smooth camera transition:

**Step 1: Click bubble → Zoom animation (600-800ms)**

```typescript
// Sử dụng framer-motion layoutAnimation hoặc custom SVG transform

const zoomTransition = {
  // Camera pan: viewport center → bubble center
  // Camera scale: current → scale that makes bubble fill ~30% of viewport
  // Other bubbles: scale down + fade to opacity 0.15 + blur(2px)
  // Selected bubble: scale up slightly (1.05x) + glow effect

  duration: 0.8,
  ease: [0.25, 0.1, 0.25, 1],  // Smooth deceleration
};
```

**Step 2: Ghost bubbles (siblings stay as context)**

```typescript
interface GhostBubble {
  id: string;
  label: string;
  mentions: number;
  sentiment: number;
  // Positioned ở rìa viewport (edge anchored)
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right';
}
```

Khi zoom vào "Giáo dục & Đời sống":
- Children bubbles (Đời Sống Gen Z, Tuyển sinh 2026) expand vào center
- Sibling campaigns (Thể thao, Thời sự, Trending...) thu nhỏ thành ghost bubbles ở rìa
- Ghost bubbles: radius 12-18px, opacity 0.35, no sparkline/pulse, chỉ label + size
- Click ghost bubble → smooth transition sang campaign đó (không cần navigate back rồi forward)

**Step 3: Breadcrumb animation**

```typescript
// Breadcrumb items animate in/out khi drill-down/up
// New item slides in from right with spring animation
// "Back" item pulses briefly khi user navigates up

// Breadcrumb cũng clickable để jump lên bất kỳ level nào
// Click "All" → smooth zoom out animation đến top level
```

#### 3.3.3 Interaction model

```
┌─────────────────────────────────────────────────────┐
│  ACTION              │  BEHAVIOR                    │
├──────────────────────┼──────────────────────────────┤
│  Single click bubble │  Select → update panel       │
│  Double click bubble │  Drill-down (zoom vào)       │
│  Right click bubble  │  Context menu (expand, pin,  │
│                      │  compare, export, share)     │
│  Hover bubble        │  Tooltip + highlight          │
│                      │  connections                  │
│  Click empty space   │  Deselect current bubble      │
│  Scroll wheel        │  Zoom in/out (map level)      │
│  Drag map            │  Pan                          │
│  Escape key          │  Zoom out one level            │
│  Tab key             │  Cycle through bubbles         │
│  Enter key           │  Drill-down into selected      │
│  / key               │  Open search overlay           │
│  Cmd+K               │  Command palette               │
└─────────────────────────────────────────────────────┘
```

#### 3.3.4 In-place expand (alternative to drill-down)

Khi user muốn xem detail mà không rời current view, cho phép expand bubble tại chỗ:

```typescript
// Double click hoặc click expand icon → bubble morphs thành card
// Card hiển thị: entity name, metrics row, top 3 children, sentiment breakdown
// Card width: 280px, animated from bubble center
// Click outside card hoặc press Escape → collapse về bubble

interface ExpandedBubbleCard {
  // Metrics row
  mentions: string;      // "22.0K"
  engagement: string;    // "2.8M"
  sentiment: string;     // "80%"

  // Children preview (top 3)
  children: {
    name: string;
    mentions: number;
    sentiment: number;
  }[];

  // Actions
  actions: ('drill-down' | 'compare' | 'export' | 'pin')[];
}
```

---

### PHASE 4: "Lens System" — Persona Filters

> **Goal:** Cho phép mỗi persona nhìn map theo góc khác nhau
> **Effort:** 2-3 tuần
> **Impact:** ★★★☆☆ (high value nhưng complex)

#### 3.4.1 Lens definition

```typescript
type LensId = 'default' | 'sentiment' | 'growth' | 'engagement' | 'crisis';

interface LensConfig {
  id: LensId;
  label: string;
  description: string;
  icon: LucideIcon;             // from lucide-react

  // Visual mappings — quy định bubble encode dimension nào vào visual nào
  sizeMapping: 'mentions' | 'engagement' | 'growth_rate' | 'reach';
  colorMapping: 'sentiment' | 'category' | 'platform' | 'growth_direction';
  pulseMapping: 'mention_velocity' | 'engagement_velocity' | 'sentiment_change_rate';
  glowMapping?: 'viral_ratio' | 'crisis_severity' | 'growth_rate';

  // Filter — ẩn bubbles không relevant
  filter?: (entity: EntityData) => boolean;

  // Sort — thay đổi z-order
  sortBy?: 'mentions' | 'sentiment' | 'growth' | 'engagement' | 'crisis_severity';
  sortOrder?: 'asc' | 'desc';
}
```

#### 3.4.2 Lens configs

```typescript
const lenses: Record<LensId, LensConfig> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Balanced view — mentions, sentiment, trend',
    icon: Eye,
    sizeMapping: 'mentions',
    colorMapping: 'sentiment',
    pulseMapping: 'mention_velocity',
  },

  sentiment: {
    id: 'sentiment',
    label: 'Sentiment',
    description: 'Focus vào cảm xúc — phát hiện crisis nhanh',
    icon: Heart,
    sizeMapping: 'mentions',
    colorMapping: 'sentiment',
    pulseMapping: 'sentiment_change_rate',
    glowMapping: 'crisis_severity',
    sortBy: 'sentiment',
    sortOrder: 'asc',          // Negative sentiment lên trên (urgent first)
  },

  growth: {
    id: 'growth',
    label: 'Growth',
    description: 'Focus vào tốc độ tăng trưởng — phát hiện trends',
    icon: TrendingUp,
    sizeMapping: 'growth_rate',     // Bubble size = % growth (not absolute mentions)
    colorMapping: 'growth_direction',
    pulseMapping: 'mention_velocity',
    sortBy: 'growth',
    sortOrder: 'desc',
  },

  engagement: {
    id: 'engagement',
    label: 'Engagement',
    description: 'Focus vào tương tác — tìm viral content',
    icon: Zap,
    sizeMapping: 'engagement',
    colorMapping: 'sentiment',
    pulseMapping: 'engagement_velocity',
    glowMapping: 'viral_ratio',     // engagement/mentions ratio
    sortBy: 'engagement',
    sortOrder: 'desc',
  },

  crisis: {
    id: 'crisis',
    label: 'Crisis',
    description: 'Chỉ hiện entities đang có vấn đề',
    icon: AlertTriangle,
    sizeMapping: 'mentions',
    colorMapping: 'sentiment',
    pulseMapping: 'sentiment_change_rate',
    glowMapping: 'crisis_severity',
    filter: (entity) => entity.sentiment < 40 || entity.sentimentChange < -10,
    sortBy: 'crisis_severity',
    sortOrder: 'desc',
  },
};
```

#### 3.4.3 Lens switcher UI

```
// Vị trí: Top-right corner của map area, cạnh zoom controls
// Style: Pill group (horizontal), compact

┌─────────────────────────────────────────┐
│  [👁 Default] [❤ Sentiment] [📈 Growth] │
│  [⚡ Engagement] [⚠ Crisis]              │
└─────────────────────────────────────────┘

// Active lens: filled background, white text
// Inactive: transparent background, muted text, border
// Hover: subtle background highlight
// Transition: 400ms morph animation khi switch lens
```

#### 3.4.4 Lens transition animation

```typescript
// Khi switch lens:
// 1. All bubbles simultaneously start morphing (400ms spring animation):
//    - Size interpolates from old radius → new radius
//    - Color interpolates from old sentiment color → new color mapping
//    - Pulse speed adjusts gradually
//    - Glow appears/disappears with fade
//
// 2. Bubbles that are filtered OUT fade to opacity 0.08 (not hidden, still visible as ghosts)
//
// 3. Remaining bubbles re-sort (z-order animation via framer-motion layout)
//
// Dùng framer-motion AnimatePresence + layoutId cho smooth transitions
```

#### 3.4.5 Saved preferences

```typescript
// User preference stored in localStorage/API:
interface UserLensPreference {
  userId: string;
  defaultLens: LensId;
  customLenses?: LensConfig[];     // Future: user-defined lenses
  pinnedEntities: string[];         // Entities user pinned to always show
}
```

---

## 4. Component Architecture

### 4.1 File structure

```
src/
├── app/
│   └── map/
│       └── page.tsx                    // Map page (Next.js App Router)
│
├── components/
│   └── map/
│       ├── MapView.tsx                 // Main container — orchestrates all components
│       ├── BubbleCanvas.tsx            // SVG/Canvas layer rendering all bubbles
│       ├── BubbleNode.tsx              // Individual bubble (sentiment ring, pulse, sparkline)
│       ├── ConnectionLayer.tsx         // SVG layer for connection threads
│       ├── GhostBubbles.tsx            // Collapsed sibling bubbles at viewport edges
│       ├── ContextPanel.tsx            // Bottom panel (overview + detail)
│       ├── ContextPanel.Summary.tsx    // Tab: summary metrics + chart
│       ├── ContextPanel.Trending.tsx   // Tab: trending keywords/posts
│       ├── ContextPanel.Alerts.tsx     // Tab: alert timeline
│       ├── ContextPanel.Timeline.tsx   // Tab: event timeline
│       ├── LensSwitcher.tsx            // Lens filter pill group
│       ├── MapControls.tsx             // Zoom, search, fullscreen controls
│       ├── BreadcrumbNav.tsx           // Animated breadcrumb
│       ├── ExpandedBubbleCard.tsx      // In-place expanded bubble detail
│       ├── LiveTicker.tsx              // Bottom live feed ticker
│       └── SearchOverlay.tsx           // Cmd+K / search overlay
│
├── hooks/
│   └── map/
│       ├── useMapNavigation.ts         // Drill-down, zoom, pan state management
│       ├── useBubbleLayout.ts          // Force-directed layout calculation
│       ├── useLens.ts                  // Lens state + visual mapping logic
│       ├── useConnections.ts           // Connection thread computation
│       ├── useMapKeyboard.ts           // Keyboard navigation handlers
│       └── useContextPanel.ts          // Panel state, resize, tab management
│
├── lib/
│   └── map/
│       ├── types.ts                    // All TypeScript interfaces
│       ├── colors.ts                   // Color palette + sentiment utils
│       ├── motion.ts                   // Framer-motion variants + transitions
│       ├── layout.ts                   // Bubble layout algorithm (force-directed)
│       ├── lens-configs.ts             // Lens definitions
│       └── calculations.ts             // Radius, pulse speed, sparkline utils
│
└── stores/
    └── map-store.ts                    // Zustand store for map state
```

### 4.2 State management (Zustand)

```typescript
interface MapStore {
  // Navigation
  currentLevel: 'campaign' | 'project' | 'keyword' | 'post' | 'comment';
  currentPath: string[];                // ["all", "campaign-123", "project-456"]
  selectedEntityId: string | null;

  // Lens
  activeLens: LensId;
  setLens: (lens: LensId) => void;

  // Data
  entities: EntityData[];
  connections: ConnectionThread[];

  // UI state
  panelCollapsed: boolean;
  panelHeight: number;
  showConnections: boolean;
  searchOpen: boolean;

  // Actions
  selectEntity: (id: string | null) => void;
  drillDown: (entityId: string) => void;
  drillUp: () => void;
  jumpToLevel: (pathIndex: number) => void;
}
```

---

## 5. Interaction Specifications

### 5.1 Tooltip on hover

Khi hover bubble, hiển thị tooltip card (không phải browser native tooltip):

```
┌──────────────────────────────────┐
│  CAMPAIGN                        │  ← Entity type badge
│  Thể thao & Esports             │  ← Name (bold)
│  Theo dõi tin tức thể thao và   │  ← Description (truncated)
│  esports trên MXH               │
│                                  │
│  Mentions   Engagement   Sent.   │
│  22.0K      2.8M         80%    │  ← Metrics row
│                                  │
│  [↗ Expand]     [2 projects →]  │  ← Action buttons
└──────────────────────────────────┘
```

**Tooltip rules:**
- Appear after 300ms hover delay (tránh flicker khi sweep qua nhiều bubbles)
- Position: prefer top-right of bubble, flip nếu gần edge
- Max width: 280px
- Dismiss: on mouse leave (100ms delay cho phép move vào tooltip)
- Animation: fade-in + slight scale from 0.95 (150ms)

### 5.2 Context menu (right-click)

```
┌──────────────────────┐
│  📌 Pin to dashboard │
│  📊 Compare with...  │
│  🔍 Deep dive        │
│  📋 Copy metrics     │
│  📤 Export data       │
│  🔗 Share link        │
│  ────────────────── │
│  🔕 Mute alerts      │
│  ⚙ Configure         │
└──────────────────────┘
```

### 5.3 Search overlay (/ or Cmd+K)

Full-screen overlay cho phép search across all entities:

```
┌──────────────────────────────────────────────────┐
│  🔍 Search campaigns, projects, keywords...      │
│  ─────────────────────────────────────────────── │
│                                                  │
│  RECENT                                          │
│  📁 Thể thao & Esports (campaign)               │
│  🔑 #tuyensinh2026 (keyword)                    │
│                                                  │
│  SUGGESTIONS                                     │
│  📁 Giáo dục & Đời sống (campaign, 16.8K)       │
│  📋 Top ngành học hot nhất 2026 (post, 4.5K)    │
│                                                  │
│  ⌨ ↑↓ Navigate  ↵ Select  Esc Close             │
└──────────────────────────────────────────────────┘
```

---

## 6. Performance Guidelines

### 6.1 Rendering strategy

```typescript
// Decision tree cho rendering approach:

if (totalBubbles <= 50) {
  // SVG rendering — tốt cho animations, interactions, accessibility
  // Dùng framer-motion cho transitions
  // Mỗi bubble là 1 SVG group element
}

else if (totalBubbles <= 500) {
  // Canvas rendering cho bubbles + SVG overlay cho interactions
  // Dùng requestAnimationFrame cho animations
  // Hit testing bằng spatial index (quadtree)
}

else {
  // WebGL (three.js hoặc pixi.js) cho mass rendering
  // Instanced rendering cho bubbles
  // LOD (level of detail) — chỉ render labels cho visible bubbles
}
```

### 6.2 Animation performance

```typescript
// Rules:
// 1. Chỉ animate transform và opacity (GPU-accelerated)
// 2. Pulse animations dùng SVG animate element (không trigger reflow)
// 3. Connection threads dùng CSS stroke-dashoffset (GPU-friendly)
// 4. Sparklines là static polylines (không animate)
// 5. Panel transitions dùng framer-motion layout animations
// 6. Tất cả animations phải respect prefers-reduced-motion:

@media (prefers-reduced-motion: reduce) {
  /* Tắt pulse, connection flow, zoom transitions */
  /* Giữ lại color changes và opacity transitions */
}
```

### 6.3 Data loading

```typescript
// Lazy loading strategy:
// Level 1 (campaigns): Load tất cả on mount
// Level 2 (projects): Load khi drill-down vào campaign
// Level 3 (keywords): Load khi drill-down vào project
// Level 4+ (posts, comments): Load on demand + paginate

// Connection threads: Tính server-side, cache 5 phút
// Sparkline data: Batch fetch cho visible bubbles
// Real-time updates: WebSocket cho mention count + sentiment changes
```

---

## 7. Responsive Considerations

### 7.1 Breakpoints

```typescript
const breakpoints = {
  mobile: '< 768px',      // Stack layout: map on top, panel below (tabs → accordion)
  tablet: '768 - 1024px', // Side-by-side nhưng panel là slide-over
  desktop: '1024 - 1440px', // Full layout như spec
  wide: '> 1440px',       // Extra space → larger bubbles, 2-column panel content
};
```

### 7.2 Touch interactions (mobile/tablet)

```
Tap bubble       → Select + show panel
Long press       → Context menu
Pinch zoom       → Map zoom
Two-finger drag  → Map pan
Swipe up panel   → Expand panel
Swipe down panel → Collapse panel
Double tap       → Drill-down
```

---

## 8. Accessibility

- Tất cả bubbles phải có `aria-label` với đầy đủ thông tin: name, mentions, sentiment, trend
- Keyboard navigation: Tab, Enter, Escape, Arrow keys
- Screen reader: Announce level changes khi drill-down/up
- Color không phải encoding duy nhất — luôn kèm text label hoặc icon
- Pulse animations respect `prefers-reduced-motion`
- Panel resizable bằng keyboard (Shift + Arrow Up/Down)
- Focus ring visible trên dark background (dùng `outline: 2px solid #60A5FA`)

---

## 9. Libraries & Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "latest",

    "framer-motion": "^11.0.0",
    "zustand": "^4.5.0",
    "d3-force": "^3.0.0",
    "d3-scale": "^4.0.0",
    "recharts": "^2.12.0",

    "@tanstack/react-query": "^5.0.0",
    "date-fns": "^3.0.0"
  }
}
```

**Library purposes:**
- `framer-motion` — Bubble transitions, panel animations, layout animations
- `zustand` — Global map state (lightweight, no boilerplate)
- `d3-force` — Force-directed bubble layout calculation (not rendering)
- `d3-scale` — Radius scale, color scale calculations
- `recharts` — Charts trong context panel (area chart, pie chart)
- `@tanstack/react-query` — Data fetching, caching, real-time updates

---

## 10. Implementation Checklist

### Phase 1: Multi-Dimension Bubbles (Week 1-2)
- [ ] Create `BubbleNode` component with sentiment ring
- [ ] Implement pulse animation with velocity-based speed
- [ ] Add sparkline rendering (conditional on radius)
- [ ] Add trend direction indicator (arrow icon)
- [ ] Implement crisis mode (red ring, fast pulse, warning icon)
- [ ] Update bubble size calculation with sqrt scale
- [ ] Add `prefers-reduced-motion` support
- [ ] Test with 5-50 bubbles at each hierarchy level

### Phase 2: Context Panel (Week 3)
- [ ] Create `ContextPanel` with resizable height
- [ ] Implement overview state (4 metric cards + trend chart + alerts)
- [ ] Implement detail state (entity metrics + children + charts)
- [ ] Add tab navigation (Summary, Trending, Alerts, Timeline)
- [ ] Animate panel transitions (select/deselect)
- [ ] Add panel collapse/expand with drag handle
- [ ] Persist panel height in localStorage

### Phase 3: Connections & Transitions (Week 4-5)
- [ ] Create `ConnectionLayer` with animated dashed lines
- [ ] Implement connection highlight on bubble hover
- [ ] Add toggle for connections visibility
- [ ] Implement smooth zoom drill-down animation
- [ ] Create `GhostBubbles` for sibling context
- [ ] Add breadcrumb animation
- [ ] Implement keyboard navigation (Tab, Enter, Escape, /)
- [ ] Add in-place expand card (double-click)

### Phase 4: Lens System (Week 6-7)
- [ ] Create `LensSwitcher` UI component
- [ ] Implement lens configs (default, sentiment, growth, engagement, crisis)
- [ ] Add bubble morph animation when switching lens
- [ ] Implement filter logic (crisis lens hides safe entities)
- [ ] Add z-order re-sorting with animation
- [ ] Save user lens preference
- [ ] Test all lens combinations at each hierarchy level

---

## 11. Mock Data Structure (for development)

```typescript
// Dùng để develop UI trước khi có real API

const mockCampaigns: EntityData[] = [
  {
    id: 'camp-1',
    label: 'Thể thao & Esports',
    description: 'Theo dõi tin tức thể thao và esports trên MXH',
    level: 'campaign',
    mentions: 22000,
    engagement: 2800000,
    sentiment: 80,
    mentionVelocity: 45,
    trendDirection: 'up',
    trendData: [18000, 18500, 19200, 19800, 20500, 21200, 22000],
    isCrisis: false,
    children: ['proj-1', 'proj-2'],
  },
  {
    id: 'camp-2',
    label: 'Thời sự Quốc tế 2026',
    description: 'Theo dõi tin tức quốc tế nổi bật',
    level: 'campaign',
    mentions: 58200,
    engagement: 5200000,
    sentiment: 55,
    mentionVelocity: 120,
    trendDirection: 'up',
    trendData: [42000, 44000, 46500, 49000, 52000, 55000, 58200],
    isCrisis: false,
    children: ['proj-3', 'proj-4'],
  },
  {
    id: 'camp-3',
    label: 'Giáo dục & Đời sống',
    description: 'Theo dõi chủ đề giáo dục và đời sống',
    level: 'campaign',
    mentions: 16800,
    engagement: 1200000,
    sentiment: 68,
    mentionVelocity: 30,
    trendDirection: 'stable',
    trendData: [15800, 16000, 16200, 16400, 16500, 16600, 16800],
    isCrisis: false,
    children: ['proj-5', 'proj-6'],
  },
  {
    id: 'camp-4',
    label: 'Trending Văn hóa & Giải trí',
    description: 'Trending content về văn hóa và giải trí',
    level: 'campaign',
    mentions: 28500,
    engagement: 3500000,
    sentiment: 75,
    mentionVelocity: 85,
    trendDirection: 'up',
    trendData: [22000, 23500, 24800, 25500, 26800, 27500, 28500],
    isCrisis: false,
    children: ['proj-7'],
  },
  {
    id: 'camp-5',
    label: 'Công nghệ & Sản phẩm',
    description: 'Review sản phẩm công nghệ mới',
    level: 'campaign',
    mentions: 15200,
    engagement: 980000,
    sentiment: 42,
    mentionVelocity: 95,
    trendDirection: 'down',
    trendData: [18000, 17500, 17000, 16500, 16000, 15600, 15200],
    isCrisis: true,          // Sentiment đang giảm nhanh
    children: ['proj-8'],
  },
];

// Projects under "Giáo dục & Đời sống"
const mockProjects: EntityData[] = [
  {
    id: 'proj-5',
    label: 'Tuyển sinh 2026',
    description: 'Theo dõi mùa tuyển sinh đại học 2026',
    level: 'project',
    mentions: 9200,
    engagement: 800000,
    sentiment: 70,
    mentionVelocity: 20,
    trendDirection: 'up',
    trendData: [7500, 7800, 8000, 8300, 8600, 8900, 9200],
    isCrisis: false,
    children: ['kw-1', 'kw-2'],
  },
  {
    id: 'proj-6',
    label: 'Đời Sống Gen Z',
    description: 'Xu hướng lối sống Gen Z',
    level: 'project',
    mentions: 7600,
    engagement: 620000,
    sentiment: 72,
    mentionVelocity: 15,
    trendDirection: 'stable',
    trendData: [7200, 7300, 7350, 7400, 7450, 7500, 7600],
    isCrisis: false,
    children: ['kw-3'],
  },
];

// Keywords under "Tuyển sinh 2026"
const mockKeywords: EntityData[] = [
  {
    id: 'kw-1',
    label: '#tuyensinh2026',
    level: 'keyword',
    mentions: 5800,
    engagement: 450000,
    sentiment: 68,
    mentionVelocity: 12,
    trendDirection: 'up',
    trendData: [4800, 5000, 5100, 5200, 5400, 5600, 5800],
    isCrisis: false,
    children: ['post-1', 'post-2'],
  },
];

// Mock connections
const mockConnections: ConnectionThread[] = [
  {
    sourceId: 'camp-1',
    targetId: 'camp-4',
    strength: 0.6,
    type: 'keyword_overlap',
  },
  {
    sourceId: 'camp-2',
    targetId: 'camp-5',
    strength: 0.4,
    type: 'mention_co_occurrence',
  },
  {
    sourceId: 'proj-5',
    targetId: 'proj-6',
    strength: 0.7,
    type: 'author_overlap',
  },
];
```
