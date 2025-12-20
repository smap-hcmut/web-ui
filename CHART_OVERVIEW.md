# 📊 Chart Components Overview

Tài liệu tổng quan về các chart components trong hệ thống SEO Controller Dashboard, bao gồm mục đích và các field cần thiết.

---

## 1. 📈 UnifiedChart

### 🎯 Mục đích
Biểu đồ tích hợp hiển thị **xu hướng mentions**, **phân tích sentiment** và **sự kiện quan trọng** trong một view duy nhất. Giúp người dùng có cái nhìn tổng quan về hiệu suất thương hiệu và phát hiện sớm các vấn đề tiềm ẩn.

### 📋 Các field cần thiết

#### **UnifiedChartData[]**
| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `date` | string | ✅ | Ngày theo định dạng ISO (YYYY-MM-DD) |
| `mentions` | number | ✅ | Số lượng mentions trong ngày |
| `sentiment` | SentimentBreakdown | ✅ | Phân tích cảm xúc theo % |
| `criticalEvents` | CriticalEvent[] | ❌ | Danh sách sự kiện quan trọng |

#### **SentimentBreakdown**
| Field | Type | Range | Mô tả |
|-------|------|-------|-------|
| `positive` | number | 0-100 | % cảm xúc tích cực |
| `negative` | number | 0-100 | % cảm xúc tiêu cực |
| `neutral` | number | 0-100 | % cảm xúc trung tính |

#### **CriticalEvent**
| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `id` | string | ✅ | ID duy nhất của sự kiện |
| `timestamp` | number | ✅ | Timestamp của sự kiện |
| `impact_score` | number | ✅ | Điểm tác động (0-100) |
| `risk` | enum | ✅ | Mức độ rủi ro (CRITICAL/HIGH/MEDIUM/LOW) |
| `title` | string | ✅ | Tiêu đề sự kiện |
| `platform` | string | ✅ | Nền tảng xảy ra sự kiện |

---

## 2. ☁️ TopicCloud

### 🎯 Mục đích
Hiển thị **trending topics** dưới dạng word cloud tương tác. Giúp xác định các chủ đề hot, phân tích sentiment của từng topic và theo dõi xu hướng thay đổi. So sánh tất cả keyword trong project dựa trên sự nhắc đến liên tục.

### 📋 Các field cần thiết

#### **TopicData[]**
| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `text` | string | ✅ | Từ khóa/chủ đề |
| `value` | number | ✅ | Tần suất/trọng số của từ khóa |
| `sentiment` | number | ❌ | Điểm cảm xúc (-1 đến 1) |
| `confidence` | number | ❌ | Độ tin cậy phân tích (0-1) |
| `trend` | enum | ❌ | Xu hướng (rising/falling/stable) |
| `mentions` | number | ❌ | Số lượng mentions |
| `engagement` | number | ❌ | Tỷ lệ tương tác (%) |

---

## 3. 🏆 CompetitorChart

### 🎯 Mục đích
So sánh **Share of Voice** giữa thương hiệu và các đối thủ cạnh tranh. Hiển thị vị trí thị trường, xác định market leader và theo dõi performance tương đối.

### 📋 Các field cần thiết

#### **CompetitorData[]**
| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `brand` | string | ✅ | Tên thương hiệu/đối thủ |
| `sov` | number | ✅ | Share of Voice (%) = mention_per_brand / sum_mention|
| `color` | string | ✅ | Màu đại diện (hex code) |

---

## 4. 🔄 SalesFunnel

### 🎯 Mục đích
Phân tích **phễu chuyển đổi**. Tính toán conversion rates, xác định điểm drop-off và tối ưu hóa customer journey. Xác định được tuần/ngày/tháng này được nhắc đến như thế nào so với tuần/ngày/tháng trước.

### 📋 Các field cần thiết

#### **FunnelStageData[]**
| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `stage` | string | ✅ | Móc thời gian |
| `count` | number | ✅ | Số lượng nhắc đến |
| `percentage` | number | ✅ | Thay đổi so với móc trước (%)|
| `change` | number | ✅ | Thay đổi so với móc trước (number) |
| `color` | string | ✅ | Màu đại diện cho giai đoạn |
| `icon` | Component | ✅ | Icon component |

---

## 5. 🔥 TopViralPosts

### 🎯 Mục đích
Theo dõi **viral posts** với phân tích rủi ro. Xác định content có impact cao, đánh giá mức độ rủi ro và cảnh báo sớm cho crisis management.

### 📋 Các field cần thiết

#### **ViralPostData[]**
| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `id` | number | ✅ | ID duy nhất của bài viết |
| `title` | string | ✅ | Tiêu đề bài viết |
| `platform` | string | ✅ | Nền tảng đăng bài |
| `engagement` | number | ✅ | Số lượng tương tác |
| `reach` | number | ✅ | Số lượt tiếp cận |
| `impact_score` | number | ✅ | Điểm tác động (0-100) |
| `risk` | enum | ✅ | Mức độ rủi ro (CRITICAL/HIGH/MEDIUM/LOW) |
| `virality_index` | number | ✅ | Chỉ số viral (0-100) |
| `timestamp` | string | ✅ | Thời gian đăng bài |
