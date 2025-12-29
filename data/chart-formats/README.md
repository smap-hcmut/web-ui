# Chart Data Formats Documentation

Thư mục này chứa các file JSON định nghĩa cấu trúc dữ liệu cho tất cả chart components trong hệ thống SEO Controller Dashboard.

## 📋 Danh sách Chart Components

### 1. [UnifiedChart](./unified-chart-data.json)
**Chức năng:** Biểu đồ tích hợp hiển thị mentions, sentiment và critical events
- **Interface:** `UnifiedChartData[]`
- **Dữ liệu chính:** mentions, sentiment breakdown, critical events
- **Tính năng:** Line/Area chart, time range selector, critical event markers

### 2. [TopicCloud](./topic-cloud-data.json) 
**Chức năng:** Word cloud hiển thị trending topics
- **Interface:** `TopicData[]`
- **Dữ liệu chính:** text, value, sentiment, trend, mentions
- **Tính năng:** Interactive word cloud, sentiment colors, trend indicators

### 3. [CompetitorChart](./competitor-chart-data.json)
**Chức năng:** Biểu đồ so sánh Share of Voice của đối thủ
- **Interface:** `CompetitorData[]`
- **Dữ liệu chính:** brand, sov (share of voice), color
- **Tính năng:** Horizontal bar chart, market leader analysis, brand ranking

### 4. [SalesFunnel](./sales-funnel-data.json)
**Chức năng:** Biểu đồ phễu bán hàng với conversion rates
- **Interface:** `FunnelStageData[]`
- **Dữ liệu chính:** stage, count, percentage, change, color, icon
- **Tính năng:** Conversion analysis, drop-off rates, performance tracking

### 5. [DataTable](./data-table-data.json)
**Chức năng:** Bảng hiển thị content performance
- **Interface:** `ContentData[]`
- **Dữ liệu chính:** id, title, platform, engagement, reach
- **Tính năng:** Sorting, filtering, engagement rate calculation

### 6. [TopViralPosts](./top-viral-posts-data.json)
**Chức năng:** Bảng viral posts với risk analysis
- **Interface:** `ViralPostData[]`
- **Dữ liệu chính:** title, platform, impact_score, risk, virality_index
- **Tính năng:** Risk assessment, virality tracking, critical alerts

## 🏗️ Cấu trúc File JSON

Mỗi file JSON chứa:

```json
{
  "description": "Mô tả chức năng của chart",
  "interface": "TypeScript interface name",
  "fields": {
    "field_name": {
      "type": "data type",
      "required": true/false,
      "description": "Mô tả field",
      "example": "Ví dụ giá trị"
    }
  },
  "sample_data": [...],
  "validation_rules": {...},
  "chart_features": {...},
  "usage_notes": {...}
}
```

## 📊 Quy tắc chung

### Data Types
- `string`: Chuỗi văn bản
- `number`: Số (integer hoặc float)
- `boolean`: True/false
- `enum`: Giá trị từ danh sách cố định
- `array`: Mảng các phần tử
- `object`: Object với các properties

### Validation Rules
- **Required fields:** Các field bắt buộc phải có
- **Range validation:** Kiểm tra giá trị trong khoảng cho phép
- **Format validation:** Kiểm tra định dạng (date, color, etc.)
- **Logic validation:** Kiểm tra logic nghiệp vụ

### Common Patterns
- **ID fields:** Luôn unique và required
- **Timestamp:** ISO format hoặc Unix timestamp
- **Percentages:** Range 0-100
- **Colors:** Hex format (#rrggbb)
- **Scores:** Thường range 0-100

## 🎯 Sử dụng

### 1. Development
```typescript
// Import interface
import { UnifiedChartData } from '@/types/charts'

// Validate data
const isValid = validateUnifiedChartData(data)

// Transform data if needed
const transformedData = transformToUnifiedData(rawData)
```

### 2. API Integration
```typescript
// API response should match interface
const response: UnifiedChartData[] = await fetchChartData()

// Pass to component
<UnifiedChart data={response} title="Mentions & Events" />
```

### 3. Testing
```typescript
// Use sample data for tests
import sampleData from '@/data/chart-formats/unified-chart-data.json'

const testData = sampleData.sample_data
```

## 🔧 Maintenance

### Thêm Chart mới
1. Tạo file JSON mới theo template
2. Định nghĩa interface trong TypeScript
3. Thêm validation rules
4. Cập nhật README này

### Cập nhật Chart hiện có
1. Cập nhật file JSON tương ứng
2. Cập nhật TypeScript interface
3. Kiểm tra backward compatibility
4. Update validation rules nếu cần

## 📝 Notes

- Tất cả charts đều hỗ trợ responsive design
- Animation và interaction có thể customize
- Error handling và loading states được xử lý ở component level
- Export functionality có sẵn cho tất cả charts

---

*Tài liệu này được cập nhật thường xuyên. Vui lòng kiểm tra phiên bản mới nhất.*