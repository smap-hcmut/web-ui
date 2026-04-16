import type { Platform } from "./mock-data";

/* ── Data hierarchy: Campaign > Project > Keyword ── */

export interface Keyword {
  id: string;
  text: string;               // e.g. "#chientranh"
  platforms: Platform[];
  volume: number;
  sentiment: number;           // 0-100
}

/* ── Crisis config types ── */

export interface SentimentRule {
  type: string;
  threshold_percent: number;
  negative_threshold_percent: number;
  critical_aspects: string[];
}

export interface VolumeRule {
  baseline: string;
  comparison_window_hours: number;
  level: string;
  threshold_percent_growth: number;
}

export interface KeywordGroup {
  name: string;
  keywords: string[];
  weight: number;
}

export interface InfluencerRule {
  type: string;
  min_followers: number;
  min_comments: number;
  min_shares: number;
  required_sentiment: string;
}

export interface CrisisConfig {
  status: "ACTIVE" | "INACTIVE";
  sentiment_trigger: {
    enabled: boolean;
    min_sample_size: number;
    rules: SentimentRule[];
  };
  volume_trigger: {
    enabled: boolean;
    metric: string;
    rules: VolumeRule[];
  };
  keywords_trigger: {
    enabled: boolean;
    logic: "AND" | "OR";
    groups: KeywordGroup[];
  };
  influencer_trigger: {
    enabled: boolean;
    logic: "AND" | "OR";
    rules: InfluencerRule[];
  };
  cron_schedule?: string;
}

export interface Project {
  id: string;
  name: string;
  keywords: Keyword[];
  platforms?: Platform[];
  status?: "active" | "paused";
  crisis_config?: CrisisConfig;
}

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "paused" | "completed";
  projects: Project[];
}

/* ── Mock campaigns ── */
export const campaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Iran Conflict Monitoring",
    status: "active",
    projects: [
      {
        id: "proj-1a",
        name: "War & Geopolitics",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-1", text: "#chientranh", platforms: ["tiktok", "facebook", "youtube"], volume: 145300, sentiment: 32 },
          { id: "kw-2", text: "#iran", platforms: ["tiktok", "youtube"], volume: 89900, sentiment: 28 },
          { id: "kw-3", text: "#israel", platforms: ["tiktok", "youtube"], volume: 5400, sentiment: 25 },
          { id: "kw-4", text: "#tinquocte", platforms: ["tiktok", "facebook"], volume: 8950, sentiment: 45 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 10, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 25, negative_threshold_percent: 50, critical_aspects: ["Chiến tranh", "Thương vong"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 200 }] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Xung đột leo thang", keywords: ["tấn công", "nổ", "tên lửa"], weight: 10 }] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/15 * * * *",
        },
      },
      {
        id: "proj-1b",
        name: "Breaking News",
        platforms: ["tiktok", "facebook"],
        status: "active",
        keywords: [
          { id: "kw-5", text: "#tinnong24h", platforms: ["tiktok", "facebook"], volume: 42800, sentiment: 40 },
          { id: "kw-6", text: "#dongdat", platforms: ["tiktok", "facebook", "youtube"], volume: 23400, sentiment: 22 },
          { id: "kw-7", text: "#socialnews", platforms: ["tiktok", "facebook", "youtube"], volume: 6200, sentiment: 55 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 5, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 30, negative_threshold_percent: 60, critical_aspects: ["Thiên tai", "Sự cố"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 150 }] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/30 * * * *",
        },
      },
      {
        id: "proj-1c",
        name: "Sanctions & Economy",
        platforms: ["facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-21", text: "#cauvan", platforms: ["facebook", "youtube"], volume: 31200, sentiment: 38 },
          { id: "kw-22", text: "#kinhtequocte", platforms: ["facebook"], volume: 18700, sentiment: 52 },
          { id: "kw-23", text: "#dautho", platforms: ["facebook", "youtube"], volume: 27500, sentiment: 35 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 10, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 20, negative_threshold_percent: 45, critical_aspects: ["Lệnh cấm vận", "Giá dầu"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 2, level: "WARNING", threshold_percent_growth: 120 }] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Khủng hoảng kinh tế", keywords: ["sụp đổ", "khủng hoảng", "lạm phát"], weight: 8 }] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/30 * * * *",
        },
      },
      {
        id: "proj-1d",
        name: "Refugee Crisis",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-24", text: "#titi", platforms: ["tiktok", "facebook"], volume: 15600, sentiment: 20 },
          { id: "kw-25", text: "#dicu", platforms: ["tiktok", "facebook", "youtube"], volume: 22300, sentiment: 25 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 5, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 15, negative_threshold_percent: 40, critical_aspects: ["Nhân đạo", "Thương vong dân thường"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 180 }] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Khẩn cấp", keywords: ["cứu trợ", "di tản", "thảm họa"], weight: 10 }] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/15 * * * *",
        },
      },
      {
        id: "proj-1e",
        name: "Nuclear Threat",
        platforms: ["tiktok", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-26", text: "#hatNhan", platforms: ["tiktok", "youtube"], volume: 38400, sentiment: 18 },
          { id: "kw-27", text: "#vukhiHuyDiet", platforms: ["tiktok", "youtube"], volume: 12900, sentiment: 15 },
          { id: "kw-28", text: "#nonproliferation", platforms: ["youtube"], volume: 4200, sentiment: 42 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 5, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 10, negative_threshold_percent: 35, critical_aspects: ["Hạt nhân", "Đe dọa"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 250 }] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Khẩn cấp hạt nhân", keywords: ["phóng xạ", "bom nguyên tử", "uranium"], weight: 10 }] },
          influencer_trigger: { enabled: true, logic: "OR", rules: [{ type: "HIGH_REACH", min_followers: 200000, min_comments: 1000, min_shares: 2000, required_sentiment: "NEGATIVE" }] },
          cron_schedule: "*/10 * * * *",
        },
      },
      {
        id: "proj-1f",
        name: "Cyber Warfare",
        platforms: ["facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-29", text: "#cyberattack", platforms: ["facebook", "youtube"], volume: 19800, sentiment: 30 },
          { id: "kw-30", text: "#hacking", platforms: ["facebook", "youtube"], volume: 14500, sentiment: 35 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 8, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 25, negative_threshold_percent: 50, critical_aspects: ["An ninh mạng", "Rò rỉ dữ liệu"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 2, level: "WARNING", threshold_percent_growth: 130 }] },
          keywords_trigger: { enabled: true, logic: "AND", groups: [{ name: "Tấn công mạng", keywords: ["DDoS", "malware", "ransomware"], weight: 9 }] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/20 * * * *",
        },
      },
      {
        id: "proj-1g",
        name: "Diplomatic Moves",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-31", text: "#ngoaigiao", platforms: ["tiktok", "facebook", "youtube"], volume: 11200, sentiment: 55 },
          { id: "kw-32", text: "#hoiNghiThuongDinh", platforms: ["facebook", "youtube"], volume: 8700, sentiment: 60 },
          { id: "kw-33", text: "#lienHopQuoc", platforms: ["tiktok", "facebook"], volume: 16300, sentiment: 50 },
        ],
        crisis_config: {
          status: "INACTIVE",
          sentiment_trigger: { enabled: false, min_sample_size: 10, rules: [] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 4, level: "INFO", threshold_percent_growth: 80 }] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "0 */2 * * *",
        },
      },
      {
        id: "proj-1h",
        name: "Propaganda & Disinfo",
        platforms: ["tiktok", "facebook"],
        status: "active",
        keywords: [
          { id: "kw-34", text: "#tinthatthiet", platforms: ["tiktok", "facebook"], volume: 33100, sentiment: 22 },
          { id: "kw-35", text: "#factcheck", platforms: ["tiktok", "facebook"], volume: 9400, sentiment: 65 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 10, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 20, negative_threshold_percent: 55, critical_aspects: ["Tin giả", "Thao túng"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 200 }] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Tin giả lan truyền", keywords: ["fake news", "bịa đặt", "deepfake"], weight: 10 }] },
          influencer_trigger: { enabled: true, logic: "OR", rules: [{ type: "HIGH_REACH", min_followers: 50000, min_comments: 300, min_shares: 800, required_sentiment: "NEGATIVE" }] },
          cron_schedule: "*/10 * * * *",
        },
      },
      {
        id: "proj-1i",
        name: "Military Hardware",
        platforms: ["tiktok", "youtube"],
        status: "paused",
        keywords: [
          { id: "kw-36", text: "#vuKhi", platforms: ["tiktok", "youtube"], volume: 28900, sentiment: 40 },
          { id: "kw-37", text: "#tenLua", platforms: ["tiktok", "youtube"], volume: 35700, sentiment: 30 },
          { id: "kw-38", text: "#F35", platforms: ["youtube"], volume: 7600, sentiment: 55 },
        ],
        crisis_config: {
          status: "INACTIVE",
          sentiment_trigger: { enabled: false, min_sample_size: 10, rules: [] },
          volume_trigger: { enabled: false, metric: "MENTIONS", rules: [] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "0 */6 * * *",
        },
      },
      {
        id: "proj-1j",
        name: "Civilian Impact",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-39", text: "#dandanthuong", platforms: ["tiktok", "facebook", "youtube"], volume: 41200, sentiment: 15 },
          { id: "kw-40", text: "#nhando", platforms: ["tiktok", "facebook"], volume: 19800, sentiment: 28 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 5, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 10, negative_threshold_percent: 30, critical_aspects: ["Thương vong", "Trẻ em"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 200 }] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Thảm họa nhân đạo", keywords: ["chết", "thương vong", "bệnh viện"], weight: 10 }] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/15 * * * *",
        },
      },
      {
        id: "proj-1k",
        name: "Oil & Energy",
        platforms: ["facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-41", text: "#giadau", platforms: ["facebook", "youtube"], volume: 24600, sentiment: 38 },
          { id: "kw-42", text: "#OPEC", platforms: ["facebook", "youtube"], volume: 8900, sentiment: 48 },
          { id: "kw-43", text: "#nangluong", platforms: ["facebook"], volume: 6300, sentiment: 55 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 10, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 25, negative_threshold_percent: 50, critical_aspects: ["Giá dầu tăng", "Thiếu hụt năng lượng"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 3, level: "WARNING", threshold_percent_growth: 100 }] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/30 * * * *",
        },
      },
      {
        id: "proj-1l",
        name: "Media & Journalism",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-44", text: "#baochi", platforms: ["tiktok", "facebook"], volume: 13400, sentiment: 45 },
          { id: "kw-45", text: "#phongvien", platforms: ["tiktok", "facebook", "youtube"], volume: 7200, sentiment: 50 },
        ],
        crisis_config: {
          status: "INACTIVE",
          sentiment_trigger: { enabled: false, min_sample_size: 10, rules: [] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 2, level: "INFO", threshold_percent_growth: 80 }] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "0 */4 * * *",
        },
      },
    ],
  },
  {
    id: "camp-2",
    name: "Entertainment & Culture",
    status: "active",
    projects: [
      {
        id: "proj-2a",
        name: "Music & Artists",
        platforms: ["tiktok", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-8", text: "#phungkhanhlinh", platforms: ["tiktok", "youtube"], volume: 12500, sentiment: 88 },
          { id: "kw-9", text: "#camonnguoidathuccungtoi", platforms: ["tiktok"], volume: 18290, sentiment: 92 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 20, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 40, negative_threshold_percent: 55, critical_aspects: ["Scandal", "Phát ngôn"] }] },
          volume_trigger: { enabled: false, metric: "MENTIONS", rules: [] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Scandal nghệ sĩ", keywords: ["bê bối", "phốt", "drama"], weight: 8 }] },
          influencer_trigger: { enabled: true, logic: "OR", rules: [{ type: "HIGH_REACH", min_followers: 100000, min_comments: 500, min_shares: 1000, required_sentiment: "NEGATIVE" }] },
          cron_schedule: "*/30 * * * *",
        },
      },
      {
        id: "proj-2b",
        name: "Gaming",
        platforms: ["tiktok", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-10", text: "#gta6", platforms: ["tiktok", "youtube"], volume: 67000, sentiment: 85 },
          { id: "kw-11", text: "#esportsvn", platforms: ["tiktok", "youtube"], volume: 11200, sentiment: 78 },
          { id: "kw-12", text: "#reviewphim", platforms: ["tiktok", "youtube"], volume: 12300, sentiment: 72 },
        ],
        crisis_config: {
          status: "INACTIVE",
          sentiment_trigger: { enabled: false, min_sample_size: 10, rules: [] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 6, level: "WARNING", threshold_percent_growth: 100 }] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "0 */2 * * *",
        },
      },
      {
        id: "proj-2c",
        name: "Sports",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "paused",
        keywords: [
          { id: "kw-13", text: "#doituyenvietnam", platforms: ["tiktok", "facebook", "youtube"], volume: 89000, sentiment: 90 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 15, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 20, negative_threshold_percent: 45, critical_aspects: ["Trọng tài", "Kết quả"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 2, level: "WARNING", threshold_percent_growth: 120 }] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/30 * * * *",
        },
      },
    ],
  },
  {
    id: "camp-3",
    name: "Tech & Innovation",
    status: "active",
    projects: [
      {
        id: "proj-3a",
        name: "AI & Tech",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-14", text: "#AI", platforms: ["tiktok", "facebook", "youtube"], volume: 25600, sentiment: 70 },
          { id: "kw-15", text: "#ChatGPT", platforms: ["tiktok", "facebook"], volume: 19800, sentiment: 68 },
          { id: "kw-16", text: "#iphone17", platforms: ["tiktok", "youtube"], volume: 34500, sentiment: 75 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 10, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 25, negative_threshold_percent: 50, critical_aspects: ["Giá", "Chất lượng"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 150 }] },
          keywords_trigger: { enabled: true, logic: "AND", groups: [{ name: "Lỗi sản phẩm", keywords: ["lỗi", "bug", "crash"], weight: 10 }, { name: "Bảo mật", keywords: ["hack", "leak", "rò rỉ"], weight: 9 }] },
          influencer_trigger: { enabled: true, logic: "OR", rules: [{ type: "HIGH_REACH", min_followers: 50000, min_comments: 200, min_shares: 500, required_sentiment: "NEGATIVE" }] },
          cron_schedule: "*/10 * * * *",
        },
      },
      {
        id: "proj-3b",
        name: "VinFast & EV",
        platforms: ["tiktok", "facebook", "youtube"],
        status: "active",
        keywords: [
          { id: "kw-17", text: "#VinFast", platforms: ["tiktok", "facebook", "youtube"], volume: 28700, sentiment: 65 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 10, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 20, negative_threshold_percent: 40, critical_aspects: ["Pin", "Chất lượng", "Giá"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 1, level: "CRITICAL", threshold_percent_growth: 150 }] },
          keywords_trigger: { enabled: true, logic: "AND", groups: [{ name: "Pin bị lỗi", keywords: ["pin", "sụt nhanh", "hư"], weight: 10 }] },
          influencer_trigger: { enabled: true, logic: "OR", rules: [{ type: "HIGH_REACH", min_followers: 100000, min_comments: 500, min_shares: 1000, required_sentiment: "NEGATIVE" }] },
          cron_schedule: "*/15 * * * *",
        },
      },
    ],
  },
  {
    id: "camp-4",
    name: "Social Trends",
    status: "paused",
    projects: [
      {
        id: "proj-4a",
        name: "Youth & Mental Health",
        platforms: ["tiktok", "facebook"],
        status: "active",
        keywords: [
          { id: "kw-18", text: "#genz", platforms: ["tiktok", "facebook"], volume: 9800, sentiment: 48 },
          { id: "kw-19", text: "#mentalhealth", platforms: ["tiktok", "facebook", "youtube"], volume: 7600, sentiment: 42 },
        ],
        crisis_config: {
          status: "ACTIVE",
          sentiment_trigger: { enabled: true, min_sample_size: 5, rules: [{ type: "NEGATIVE_SPIKE", threshold_percent: 15, negative_threshold_percent: 35, critical_aspects: ["Tự tử", "Bạo lực"] }] },
          volume_trigger: { enabled: true, metric: "MENTIONS", rules: [{ baseline: "PREVIOUS_PERIOD", comparison_window_hours: 3, level: "WARNING", threshold_percent_growth: 100 }] },
          keywords_trigger: { enabled: true, logic: "OR", groups: [{ name: "Nguy hiểm", keywords: ["tự tử", "bạo lực học đường", "trầm cảm nặng"], weight: 10 }] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "*/20 * * * *",
        },
      },
      {
        id: "proj-4b",
        name: "Education",
        platforms: ["tiktok", "facebook"],
        status: "paused",
        keywords: [
          { id: "kw-20", text: "#tuyensinh2026", platforms: ["tiktok", "facebook"], volume: 15400, sentiment: 55 },
        ],
        crisis_config: {
          status: "INACTIVE",
          sentiment_trigger: { enabled: false, min_sample_size: 10, rules: [] },
          volume_trigger: { enabled: false, metric: "MENTIONS", rules: [] },
          keywords_trigger: { enabled: false, logic: "AND", groups: [] },
          influencer_trigger: { enabled: false, logic: "OR", rules: [] },
          cron_schedule: "0 */6 * * *",
        },
      },
    ],
  },
];

