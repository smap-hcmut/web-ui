# Change: Add Dashboard Summary and Top Keywords API Integration

## Why

Hiện tại dashboard chỉ sử dụng API `/analytic/posts/all` để lấy raw posts data và thực hiện toàn bộ aggregation/transformation ở frontend ([dashboard.service.ts](../../lib/api/services/dashboard.service.ts)). Backend đã cung cấp 2 APIs mới:

1. **`/analytic/summary`**: Trả về các metrics đã được tính toán sẵn (total_posts, sentiment_distribution, engagement_totals, etc.)
2. **`/analytic/top-keywords`**: Trả về top 20 keywords trending với aspect classification và ranking của project keywords

Việc tích hợp cả 2 APIs sẽ:
- **Giảm tải cho frontend**: Không cần aggregate lại metrics và keywords từ raw posts
- **Cải thiện performance**: Summary (~5KB) + Top Keywords (~10KB) nhỏ hơn nhiều so với fetch toàn bộ posts (500KB+)
- **Đảm bảo consistency**: Backend tính toán metrics và aspect classification theo logic chuẩn
- **Tối ưu bandwidth**: Chỉ cần fetch posts data khi cần chi tiết (viral posts, time-series)
- **Rich keyword insights**: Hiển thị aspect (PRICE, PERFORMANCE, DESIGN, SERVICE) và ranking của project keywords

## What Changes

- **Thêm summary API service**: Tạo method `getDashboardSummary()` trong dashboard.service.ts để fetch từ `/analytic/summary`
- **Thêm top-keywords API service**: Tạo method `getTopKeywords()` để fetch từ `/analytic/top-keywords` với project keywords ranking
- **Optimize data fetching strategy**: Sử dụng summary cho metrics cards, top-keywords cho TopicCloud, chỉ fetch posts khi cần time-series/viral
- **Update TopicCloud UI**:
  - Hiển thị top 20 keywords trong word cloud với màu theo aspect (PRICE/PERFORMANCE/DESIGN/SERVICE)
  - Hiển thị ranking table phía dưới với project keywords được highlight
  - Project keywords rank < 5 hiển thị ở top với badge đặc biệt ("Top 5")
  - Project keywords rank >= 5 hiển thị ở bottom với màu khác biệt (accent color)
  - Keywords có aspect classification với color coding
- **Update DashboardContext**: Quản lý summary, top-keywords và posts data riêng biệt
- **Smart caching**: Cache riêng cho summary (TTL 3min), top-keywords (TTL 5min), posts (TTL 10min)

## Impact

### Affected Capabilities
- **dashboard-analytics**: MODIFIED - Thêm summary API integration và optimize data fetching strategy

### Affected Code
- `lib/api/services/dashboard.service.ts` - Thêm `getDashboardSummary()` và `getTopKeywords()` methods với response types
- `lib/utils/dashboardDataTransform.ts` - Update để sử dụng summary data và top-keywords khi có sẵn
- `hooks/useDashboardData.ts` - Fetch summary, top-keywords và posts, cache riêng biệt cho từng loại
- `contexts/DashboardContext.tsx` - Quản lý summary, topKeywords và posts state
- `components/dashboard/DashboardGrid.tsx` - Sử dụng summary data cho metrics cards
- `components/dashboard/MetricCard.tsx` - Adjust để nhận data từ summary API
- `components/dashboard/charts/TopicCloud.tsx` - Major UI update:
  - Word cloud hiển thị top 20 keywords từ API
  - Ranking table hiển thị project keywords với highlight
  - Aspect-based color coding (PRICE/PERFORMANCE/DESIGN/SERVICE)
  - Top 5 project keywords với badge đặc biệt

### Breaking Changes
Không có breaking changes. Components giữ nguyên interface, chỉ thay đổi data source.

### Data Flow

```
Initial Load (Three-Phase Strategy):

  Phase 1 (Priority - <500ms):
    GET /analytic/summary?project_id=X (~5KB)
    ↓
    Display metrics cards immediately ✅

  Phase 2 (Fast - <1s):
    GET /analytic/top-keywords?project_id=X&limit=20&include_rank_for={project_keywords} (~10KB)
    ↓
    Display TopicCloud with rankings ✅

  Phase 3 (Background - 2-5s):
    GET /analytic/posts/all (slower, ~500KB+)
    ↓
    Transform posts → viral posts, time-series
    ↓
    Update remaining charts when ready ✅

Subsequent visits:
  - Show cached summary + top-keywords + posts instantly
  - Revalidate summary & top-keywords in background (fast)
  - Revalidate posts only if TTL expired (slower)
```

## API Response Structure

### GET /analytic/summary

**Endpoint**: `GET /analytic/summary?project_id={project_id}`

**Response**:
```json
{
  "success": true,
  "data": {
    "total_posts": 70,
    "total_comments": 8439480,
    "sentiment_distribution": {
      "POSITIVE": 59,
      "NEUTRAL": 7,
      "NEGATIVE": 4
    },
    "avg_sentiment_score": 0.7857142857142857,
    "risk_distribution": {
      "MEDIUM": 16,
      "CRITICAL": 8,
      "HIGH": 5,
      "LOW": 41
    },
    "intent_distribution": {
      "SEEDING": 2,
      "SUPPORT": 1,
      "LEAD": 4,
      "DISCUSSION": 63
    },
    "platform_distribution": {
      "TIKTOK": 70
    },
    "engagement_totals": {
      "views": 24780501,
      "likes": 1729425,
      "comments": 8439480,
      "shares": 67842,
      "saves": 167489
    },
    "viral_count": 16,
    "kol_count": 14,
    "avg_impact_score": 32.84557514832298
  }
}
```

### GET /analytic/top-keywords

**Endpoint**: `GET /analytic/top-keywords?project_id={project_id}&limit=20&include_rank_for={keyword1,keyword2,...}`

**Parameters**:
- `project_id` (required): Project ID
- `limit` (optional, default 20): Số lượng top keywords trả về
- `include_rank_for` (optional): Comma-separated list của keywords trong project để get ranking

**Response**:
```json
{
  "success": true,
  "data": {
    "keywords": [
      {
        "keyword": "tiền",
        "count": 4,
        "avg_sentiment_score": 1,
        "aspect": "PRICE",
        "sentiment_breakdown": {
          "POSITIVE": 0,
          "NEUTRAL": 0,
          "NEGATIVE": 0
        }
      },
      {
        "keyword": "phí",
        "count": 4,
        "avg_sentiment_score": 1,
        "aspect": "PRICE",
        "sentiment_breakdown": {
          "POSITIVE": 0,
          "NEUTRAL": 0,
          "NEGATIVE": 0
        }
      },
      {
        "keyword": "màu",
        "count": 3,
        "avg_sentiment_score": 1,
        "aspect": "DESIGN",
        "sentiment_breakdown": {
          "POSITIVE": 0,
          "NEUTRAL": 0,
          "NEGATIVE": 0
        }
      },
      {
        "keyword": "lag",
        "count": 3,
        "avg_sentiment_score": 1,
        "aspect": "PERFORMANCE",
        "sentiment_breakdown": {
          "POSITIVE": 0,
          "NEUTRAL": 0,
          "NEGATIVE": 0
        }
      }
    ],
    "input_keyword_ranks": [
      {
        "keyword": "kiro",
        "rank": null,
        "count": 0,
        "avg_sentiment_score": 0,
        "in_top": false
      },
      {
        "keyword": "tiền",
        "rank": 1,
        "count": 4,
        "avg_sentiment_score": 1,
        "in_top": true,
        "aspect": "PRICE"
      }
    ]
  }
}
```

**Aspects Classification**:
- `PRICE`: Keywords về giá cả, chi phí (tiền, phí, giá, hời)
- `PERFORMANCE`: Keywords về hiệu suất (lag, esp, km, tốc độ, động cơ, êm)
- `DESIGN`: Keywords về thiết kế (màu, đèn, thiết kế)
- `SERVICE`: Keywords về dịch vụ (cứu hộ, hỗ trợ)

## Mapping APIs to Charts

### Summary API Coverage:

✅ **Metrics Cards**:
- Total Mentions: `total_posts`
- Sentiment Score: `avg_sentiment_score`
- Engagement Rate: Calculate from `engagement_totals`
- Share of Voice: Calculate from `platform_distribution` or `brand_name` (nếu backend thêm)

✅ **Risk Distribution**: `risk_distribution` (CRITICAL/HIGH/MEDIUM/LOW counts)

✅ **Platform Distribution**: `platform_distribution` (TIKTOK/YOUTUBE/etc.)

### Top Keywords API Coverage:

✅ **TopicCloud** (NEW):
- **Word Cloud**: Top 20 keywords với size theo `count`
- **Aspect Colors**:
  - PRICE → Orange (#f59e0b)
  - PERFORMANCE → Blue (#3b82f6)
  - DESIGN → Purple (#8b5cf6)
  - SERVICE → Green (#10b981)
- **Ranking Table**:
  - Show all `input_keyword_ranks`
  - Rank < 5 → Display at top with "Top 5" badge, gold/accent color
  - Rank >= 5 → Display at bottom with normal styling
  - Not in top 20 → Show rank as "20+" with gray color
- **Sentiment indicators**: Use `sentiment_breakdown` để hiển thị sentiment bars

### Still need `/analytic/posts/all` for:

❌ **UnifiedChart**: Time-series data (mentions + sentiment by day)
❌ **TopViralPosts**: Detailed viral posts list (title, engagement, risk, permalink)
❌ **SalesFunnel**: Time comparison data (week-over-week, month-over-month)
❌ **CompetitorChart**: SOV per brand breakdown

## Dependencies

- Requires backend API endpoint `/analytic/summary` to be available ✅ (already exists)
- Requires backend API endpoint `/analytic/top-keywords` to be available ✅ (already exists)
- No new external dependencies needed (sử dụng existing axios client)
- Project must have keywords configured để sử dụng `include_rank_for` parameter

## Risks & Mitigations

**Risk 1**: Summary API và Posts API có thể trả về data không sync (ví dụ: summary có 70 posts nhưng posts/all trả về 68)
- *Mitigation*: Accept eventual consistency, show summary metrics first, update khi posts loaded. Display timestamp để user biết data freshness.

**Risk 2**: Summary API không có breakdown chi tiết (ví dụ: SOV per brand)
- *Mitigation*: Fallback về calculate từ posts data. Document rõ fields nào cần backend thêm vào summary API trong tương lai.

**Risk 3**: Cache invalidation phức tạp khi có 3 data sources
- *Mitigation*: Sử dụng cùng cache key prefix (project_id), invalidate cả 3 khi project thay đổi hoặc user trigger refresh.

**Risk 4**: Top-keywords API phụ thuộc vào project keywords configuration
- *Mitigation*: Nếu project chưa có keywords configured, skip `include_rank_for` parameter, chỉ hiển thị top 20 keywords mà không có ranking table.

**Risk 5**: Aspect classification có thể sai hoặc thiếu cho một số keywords
- *Mitigation*: Fallback về default color (gray) nếu aspect null/undefined. Display aspect label trong tooltip để user biết classification.

## Success Criteria

- Dashboard metrics cards hiển thị ngay lập tức từ summary API (<500ms)
- TopicCloud hiển thị trong <1s với top-keywords API
- Project keywords được highlight properly trong ranking table
- Top 5 project keywords có badge và styling đặc biệt
- Aspect-based colors hiển thị đúng cho keywords (PRICE/PERFORMANCE/DESIGN/SERVICE)
- Reduce initial API payload size (summary ~5KB + top-keywords ~10KB vs posts ~500KB+)
- Graceful degradation: Nếu APIs fail, fallback về calculate từ posts
- All existing dashboard functionality vẫn hoạt động
- Cache strategy hoạt động đúng cho cả 3 APIs (summary, top-keywords, posts)

## TopicCloud UI Design

### Word Cloud Section
```
┌─────────────────────────────────────────┐
│  Trending Keywords                      │
│                                         │
│      tiền (PRICE - Orange)              │
│   lag (PERFORMANCE - Blue)              │
│        màu (DESIGN - Purple)            │
│    phí (PRICE - Orange)                 │
│  hỗ trợ (SERVICE - Green)              │
│        ...                              │
│                                         │
└─────────────────────────────────────────┘
```

### Ranking Table Section
```
┌─────────────────────────────────────────┐
│  Your Keywords Performance              │
├─────────────────────────────────────────┤
│  🏆 TOP 5 KEYWORDS                      │
│  #1  tiền      [PRICE]     ████ 85%    │  ← Gold/Accent color, "Top 5" badge
│  #3  màu       [DESIGN]    ███  70%    │
├─────────────────────────────────────────┤
│  📊 OTHER KEYWORDS                      │
│  #8  kiro      [BRAND]     ██   45%    │  ← Normal color
│  #15 giá       [PRICE]     █    30%    │
│  20+ xe hơi    [GENERAL]   ▁    10%    │  ← Gray, not in top 20
└─────────────────────────────────────────┘
```

## Future Enhancements

Có thể đề xuất backend team thêm vào future versions:

### `/analytic/summary` enhancements:
- **Brand SOV breakdown**: `{ "BrandA": 40, "BrandB": 35, ... }`
- **Time-series summary**: `mentions_by_day`, `sentiment_by_day` để tránh fetch posts

### `/analytic/top-keywords` enhancements:
- **Trend direction**: `trend: "rising" | "falling" | "stable"` cho mỗi keyword
- **Related keywords**: `related: ["keyword1", "keyword2"]` để show keyword clusters
- **Time range comparison**: Historical ranking để show rank changes
