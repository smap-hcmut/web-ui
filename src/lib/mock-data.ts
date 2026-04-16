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
  {
    rank: 9,
    keyword: "#doituyenvietnam",
    volume: 89000,
    change: 156.2,
    platforms: ["tiktok", "facebook", "youtube"],
  },
  {
    rank: 10,
    keyword: "#iphone17",
    volume: 34500,
    change: 89.3,
    platforms: ["tiktok", "youtube"],
  },
  {
    rank: 11,
    keyword: "#VinFast",
    volume: 28700,
    change: 42.1,
    platforms: ["tiktok", "facebook", "youtube"],
  },
  {
    rank: 12,
    keyword: "#AI",
    volume: 25600,
    change: 67.8,
    platforms: ["tiktok", "facebook", "youtube"],
  },
  {
    rank: 13,
    keyword: "#ChatGPT",
    volume: 19800,
    change: 55.4,
    platforms: ["tiktok", "facebook"],
  },
  {
    rank: 14,
    keyword: "#tuyensinh2026",
    volume: 15400,
    change: 112.6,
    platforms: ["tiktok", "facebook"],
  },
  {
    rank: 15,
    keyword: "#gta6",
    volume: 67000,
    change: 320.5,
    platforms: ["tiktok", "youtube"],
  },
  {
    rank: 16,
    keyword: "#reviewphim",
    volume: 12300,
    change: 38.9,
    platforms: ["tiktok", "youtube"],
  },
  {
    rank: 17,
    keyword: "#esportsvn",
    volume: 11200,
    change: 73.1,
    platforms: ["tiktok", "youtube"],
  },
  {
    rank: 18,
    keyword: "#genz",
    volume: 9800,
    change: 28.4,
    platforms: ["tiktok", "facebook"],
  },
  {
    rank: 19,
    keyword: "#mentalhealth",
    volume: 7600,
    change: 45.2,
    platforms: ["tiktok", "facebook", "youtube"],
  },
  {
    rank: 20,
    keyword: "#dongdat",
    volume: 23400,
    change: 890.3,
    platforms: ["tiktok", "facebook", "youtube"],
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
  {
    id: "7",
    platform: "facebook",
    author: "BBC Tiếng Việt",
    content:
      "Phân tích toàn diện cuộc xung đột Iran-Israel: Nguyên nhân, diễn biến và hậu quả #chientranh #iran",
    time: "38m ago",
    sentiment: "neutral",
    engagement: 230000,
  },
  {
    id: "8",
    platform: "youtube",
    author: "VTV24",
    content:
      "BẢN TIN CHIẾN SỰ IRAN 05/03/2026: Không quân Mỹ tấn công cơ sở hạt nhân, Iran tuyên bố trả đũa",
    time: "45m ago",
    sentiment: "negative",
    engagement: 189000,
  },
  {
    id: "9",
    platform: "tiktok",
    author: "Bóng Đá 360",
    content:
      "HIGHLIGHTS: Việt Nam 3-1 Thái Lan - Chiến thắng lịch sử tại AFF Cup 2026! 🇻🇳⚽ #doituyenvietnam #affcup",
    time: "52m ago",
    sentiment: "positive",
    engagement: 890000,
  },
  {
    id: "10",
    platform: "tiktok",
    author: "Unbox Therapy VN",
    content:
      "UNBOX iPhone 17 Pro Max ĐẦU TIÊN tại Việt Nam! Giá 38 triệu có đáng? #iphone17 #unbox #apple",
    time: "1h ago",
    sentiment: "positive",
    engagement: 345000,
  },
  {
    id: "11",
    platform: "facebook",
    author: "VnExpress",
    content:
      "INFOGRAPHIC: Toàn cảnh xung đột Iran sau 30 ngày - Thiệt hại hai bên #chientranh #iran #infographic",
    time: "1h ago",
    sentiment: "negative",
    engagement: 312000,
  },
  {
    id: "12",
    platform: "tiktok",
    author: "Tin Nóng 24H",
    content:
      "NÓNG: Động đất 7.2 độ richter tại Nhật Bản, cảnh báo sóng thần #tinnong24h #dongdat #nhatban",
    time: "1h ago",
    sentiment: "negative",
    engagement: 234000,
  },
  {
    id: "13",
    platform: "tiktok",
    author: "VinFast Official",
    content:
      "VinFast VF3 chính thức bán ra - Xe điện mini CHỈ TỪ 235 TRIỆU 🚗⚡ #VinFast #VF3 #xedien",
    time: "2h ago",
    sentiment: "positive",
    engagement: 890000,
  },
  {
    id: "14",
    platform: "youtube",
    author: "Phùng Khánh Linh Official",
    content:
      "Phùng Khánh Linh - Cảm Ơn Người Đã Thức Cùng Tôi | Official Music Video #camonnguoidathuccungtoi",
    time: "2h ago",
    sentiment: "positive",
    engagement: 890000,
  },
  {
    id: "15",
    platform: "tiktok",
    author: "AI Explained VN",
    content:
      "AI có thay thế lập trình viên không? Câu trả lời sẽ khiến bạn bất ngờ #AI #laptrinhvien #congnghe",
    time: "2h ago",
    sentiment: "neutral",
    engagement: 345000,
  },
  {
    id: "16",
    platform: "facebook",
    author: "GPT Vietnam Community",
    content:
      "SO SÁNH CHI TIẾT: ChatGPT-5 vs Claude 4 vs Gemini 2.0 - AI nào đỉnh nhất 2026? #ChatGPT #Claude #Gemini",
    time: "3h ago",
    sentiment: "neutral",
    engagement: 345000,
  },
  {
    id: "17",
    platform: "tiktok",
    author: "Esports VN",
    content:
      "GAM Esports VÔ ĐỊCH VCS Spring 2026! Sweep 3-0 trước Team Flash 🏆🎮 #esportsvn #vcs #gam",
    time: "3h ago",
    sentiment: "positive",
    engagement: 340000,
  },
  {
    id: "18",
    platform: "tiktok",
    author: "Gaming VN Tips",
    content:
      "GTA 6 CHÍNH THỨC RA MẮT! Review nhanh sau 24h chơi - Có xứng đáng chờ đợi? #gaming #gta6 #review",
    time: "3h ago",
    sentiment: "positive",
    engagement: 670000,
  },
  {
    id: "19",
    platform: "facebook",
    author: "Dân Trí",
    content:
      "Bão số 3 đổ bộ miền Trung: 15 người mất tích, hàng nghìn ngôi nhà bị ngập #tinnong24h #baolu #mientrung",
    time: "4h ago",
    sentiment: "negative",
    engagement: 456000,
  },
  {
    id: "20",
    platform: "tiktok",
    author: "Review Phim Hay",
    content:
      "Review phim MAI của Trấn Thành - Phim Việt hay nhất 2026? #reviewphim #mai #tranthanh #phimviet",
    time: "4h ago",
    sentiment: "positive",
    engagement: 456000,
  },
  {
    id: "21",
    platform: "facebook",
    author: "Bộ GD&ĐT",
    content:
      "CHÍNH THỨC: Bộ GD&ĐT công bố thay đổi quy chế tuyển sinh đại học 2026 - Thêm phương thức xét tuyển mới #tuyensinh2026",
    time: "5h ago",
    sentiment: "neutral",
    engagement: 456000,
  },
  {
    id: "22",
    platform: "tiktok",
    author: "GenZ Life VN",
    content:
      "Gen Z đang kiệt sức: Áp lực thành công sớm từ MXH có đang hủy hoại giới trẻ? #genz #apluc #mentalhealth",
    time: "5h ago",
    sentiment: "negative",
    engagement: 345000,
  },
  {
    id: "23",
    platform: "youtube",
    author: "Xế Cộng",
    content:
      "VinFast giao lô VF9 đầu tiên tại California: Phản hồi từ khách Mỹ ra sao? #VinFast #VF9 #xuatkhau",
    time: "6h ago",
    sentiment: "positive",
    engagement: 234000,
  },
  {
    id: "24",
    platform: "tiktok",
    author: "Concert Review",
    content:
      "Phùng Khánh Linh concert 'Ngày Đẹp Trời' tại Hà Nội - CHÁY VÉ sau 2 phút! #phungkhanhlinh #concert",
    time: "6h ago",
    sentiment: "positive",
    engagement: 230000,
  },
  {
    id: "25",
    platform: "facebook",
    author: "Zing News",
    content:
      "Cảnh báo: Hàng loạt tin giả về chiến sự Iran lan truyền trên MXH Việt Nam #socialnews #fakenews",
    time: "7h ago",
    sentiment: "negative",
    engagement: 123000,
  },
  {
    id: "26",
    platform: "tiktok",
    author: "ChatGPT Tips VN",
    content:
      "5 prompt ChatGPT thần thánh giúp bạn viết content x10 tốc độ #ChatGPT #prompt #content #tips",
    time: "7h ago",
    sentiment: "positive",
    engagement: 456000,
  },
  {
    id: "27",
    platform: "tiktok",
    author: "Food Hunter VN",
    content:
      "Tìm được quán phở 40 năm tuổi ngon nhất Sài Gòn, xếp hàng 2 tiếng mới ăn được 🍜 #fyp #food #pho",
    time: "8h ago",
    sentiment: "positive",
    engagement: 189000,
  },
  {
    id: "28",
    platform: "facebook",
    author: "Tuổi Trẻ Online",
    content:
      "PHÓNG SỰ ĐẶC BIỆT: Cuộc sống người dân Iran ở vùng biên giới giữa mưa bom bão đạn",
    time: "8h ago",
    sentiment: "negative",
    engagement: 156000,
  },
  {
    id: "29",
    platform: "tiktok",
    author: "Dance Crew VN",
    content:
      "Thử thách vũ đạo mới đang viral trên FYP 🔥💃 #fyp #dance #challenge #viral",
    time: "9h ago",
    sentiment: "positive",
    engagement: 340000,
  },
  {
    id: "30",
    platform: "tiktok",
    author: "Mental Health VN",
    content:
      "5 dấu hiệu bạn đang BURNOUT mà không biết - Và cách phục hồi #mentalhealth #burnout #selfcare",
    time: "10h ago",
    sentiment: "neutral",
    engagement: 189000,
  },
];
