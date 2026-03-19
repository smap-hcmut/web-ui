export type Platform = "tiktok" | "facebook" | "youtube";

export interface MetricData {
  label: string;
  value: string;
  change: number;
  trend: number[];
  icon: string;
}

export interface PlatformData {
  platform: Platform;
  name: string;
  mentions: number;
  mentionsChange: number;
  engagement: string;
  engagementChange: number;
  followers: string;
  followersChange: number;
  sentiment: number;
  trend: number[];
  status: "active" | "inactive";
}

export interface TrendItem {
  rank: number;
  keyword: string;
  volume: number;
  change: number;
  platforms: Platform[];
}

export interface ActivityItem {
  id: string;
  platform: Platform;
  author: string;
  content: string;
  time: string;
  sentiment: "positive" | "negative" | "neutral";
  engagement: number;
}

export const overviewMetrics: MetricData[] = [
  {
    label: "Total Mentions",
    value: "38,247",
    change: 18.3,
    trend: [35, 42, 50, 48, 55, 62, 58, 68, 72, 80, 85, 92],
    icon: "activity",
  },
  {
    label: "Sentiment Score",
    value: "72.6%",
    change: -2.1,
    trend: [78, 76, 74, 72, 70, 73, 71, 74, 72, 70, 73, 73],
    icon: "smile",
  },
  {
    label: "Engagement",
    value: "7.3M",
    change: 22.1,
    trend: [40, 48, 55, 60, 65, 72, 78, 82, 88, 90, 95, 98],
    icon: "heart",
  },
  {
    label: "Audience Reach",
    value: "12.8M",
    change: 15.7,
    trend: [25, 32, 38, 45, 50, 58, 62, 70, 75, 82, 88, 95],
    icon: "users",
  },
];

export const platformData: PlatformData[] = [
  {
    platform: "tiktok",
    name: "TikTok",
    mentions: 24580,
    mentionsChange: 22.5,
    engagement: "4.1M",
    engagementChange: 28.3,
    followers: "89.2K",
    followersChange: 8.7,
    sentiment: 76,
    trend: [45, 50, 55, 58, 62, 68, 72, 78, 82, 88, 90, 95],
    status: "active",
  },
  {
    platform: "facebook",
    name: "Facebook",
    mentions: 8920,
    mentionsChange: 7.2,
    engagement: "1.8M",
    engagementChange: 5.4,
    followers: "156K",
    followersChange: 2.3,
    sentiment: 70,
    trend: [52, 50, 54, 56, 55, 58, 57, 60, 59, 62, 61, 64],
    status: "active",
  },
  {
    platform: "youtube",
    name: "YouTube",
    mentions: 4747,
    mentionsChange: 3.8,
    engagement: "1.4M",
    engagementChange: 9.1,
    followers: "112K",
    followersChange: 4.5,
    sentiment: 68,
    trend: [58, 55, 57, 54, 56, 53, 55, 52, 54, 56, 53, 50],
    status: "active",
  },
];

export const trendingTopics: TrendItem[] = [
  {
    rank: 1,
    keyword: "#chientranh",
    volume: 145300,
    change: 68.5,
    platforms: ["tiktok", "facebook", "youtube"],
  },
  {
    rank: 2,
    keyword: "#iran",
    volume: 89900,
    change: 52.3,
    platforms: ["tiktok", "youtube"],
  },
  {
    rank: 3,
    keyword: "#tinnong24h",
    volume: 42800,
    change: 35.1,
    platforms: ["tiktok", "facebook"],
  },
  {
    rank: 4,
    keyword: "#camonnguoidathuccungtoi",
    volume: 18290,
    change: 128.4,
    platforms: ["tiktok"],
  },
  {
    rank: 5,
    keyword: "#phungkhanhlinh",
    volume: 12500,
    change: 45.7,
    platforms: ["tiktok", "youtube"],
  },
  {
    rank: 6,
    keyword: "#tinquocte",
    volume: 8950,
    change: 22.8,
    platforms: ["tiktok", "facebook"],
  },
  {
    rank: 7,
    keyword: "#socialnews",
    volume: 6200,
    change: 15.3,
    platforms: ["tiktok", "facebook", "youtube"],
  },
  {
    rank: 8,
    keyword: "#israel",
    volume: 5400,
    change: 41.2,
    platforms: ["tiktok", "youtube"],
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "1",
    platform: "tiktok",
    author: "Báo Hà Tĩnh",
    content:
      "Giây phút tên lửa Iran vượt qua lưới phòng không Israel #tinnong #chientranh #iran #israel",
    time: "2m ago",
    sentiment: "neutral",
    engagement: 145300,
  },
  {
    id: "2",
    platform: "tiktok",
    author: "Vũ Trụ News",
    content:
      "Iran chính thức đi vào lịch sử, khi một mình vã 15 nước trong 1 ngày tuyên bố không đàm phán với Mỹ",
    time: "5m ago",
    sentiment: "neutral",
    engagement: 89900,
  },
  {
    id: "3",
    platform: "tiktok",
    author: "Hồng Ngọc",
    content:
      "Lý do gì mà 2 nước chiến tranh vậy mn. ko biết nên hỏi ạ",
    time: "12m ago",
    sentiment: "neutral",
    engagement: 130,
  },
  {
    id: "4",
    platform: "tiktok",
    author: "Tina - repair paint",
    content:
      "Nước Mỹ mượn lý do giải phóng dân Iran, Mỹ nói giải cứu dân Iran khỏi chế độ độc tài 47 năm.",
    time: "18m ago",
    sentiment: "negative",
    engagement: 239,
  },
  {
    id: "5",
    platform: "tiktok",
    author: "Love's Lament",
    content:
      "Cảm Ơn Người Đã Thức Cùng Tôi // Phùng Khánh Linh #camonnguoidathuccungtoi #phungkhanhlinh #lyrics",
    time: "25m ago",
    sentiment: "positive",
    engagement: 6178,
  },
  {
    id: "6",
    platform: "tiktok",
    author: "Toàn Cảnh 60S",
    content:
      "Cập nhật tình hình chiến sự tại Trung Đông. Thời sự sáng 05.00 ngày 05/3/2026 #chientranh #iran",
    time: "32m ago",
    sentiment: "neutral",
    engagement: 329,
  },
];
