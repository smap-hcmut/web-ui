import type { Platform } from './mock-data';

export interface PostComment {
  id: string;
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  likes: number;
  time: string;
  replies?: PostComment[];
}

export interface PostDetail {
  id: string;
  platform: Platform;
  author: string;
  authorAvatar?: string;
  content: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  engagementTrend: number[]; // last 7 days
  topComments: PostComment[];
  keywords: string[];
  url: string;
}

export function generatePostDetail(post: {
  id: string;
  platform: Platform;
  author: string;
  content: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: number;
}): PostDetail {
  const likes = post.engagement;
  const comments = Math.floor(likes * 0.12);
  const shares = Math.floor(likes * 0.05);
  const views = likes * (3 + Math.random() * 7);

  const posRatio = post.sentiment === 'positive' ? 0.65 : post.sentiment === 'negative' ? 0.15 : 0.35;
  const negRatio = post.sentiment === 'negative' ? 0.55 : post.sentiment === 'positive' ? 0.1 : 0.25;

  return {
    ...post,
    likes,
    comments,
    shares,
    views: Math.round(views),
    sentimentBreakdown: {
      positive: Math.round(posRatio * 100),
      neutral: Math.round((1 - posRatio - negRatio) * 100),
      negative: Math.round(negRatio * 100),
    },
    engagementTrend: Array.from({ length: 7 }, (_, i) => Math.round(likes * (0.3 + Math.random() * 0.7) * ((i + 1) / 7))),
    keywords: extractKeywords(post.content),
    url: `https://${post.platform}.com/post/${post.id}`,
    topComments: generateComments(post.id),
  };
}

function extractKeywords(content: string): string[] {
  return (content.match(/#\w+/g) || []).slice(0, 5);
}

function generateComments(postId: string): PostComment[] {
  const pool: PostComment[] = [
    { id: `${postId}-c1`, author: 'Minh Tuấn', content: 'Bài viết rất hay, cảm ơn đã chia sẻ! 👏', sentiment: 'positive', likes: 234, time: '1h ago' },
    { id: `${postId}-c2`, author: 'Thu Hà', content: 'Thông tin không chính xác, cần kiểm chứng lại nguồn tin.', sentiment: 'negative', likes: 89, time: '2h ago' },
    { id: `${postId}-c3`, author: 'Đức Anh', content: 'Chia sẻ cho mn cùng biết nha', sentiment: 'neutral', likes: 45, time: '3h ago' },
    { id: `${postId}-c4`, author: 'Lan Phương', content: 'Tình hình ngày càng phức tạp 😟', sentiment: 'negative', likes: 156, time: '3h ago' },
    { id: `${postId}-c5`, author: 'Hoàng Nam', content: 'Quá đỉnh luôn! 🔥🔥🔥', sentiment: 'positive', likes: 312, time: '4h ago' },
    { id: `${postId}-c6`, author: 'Ngọc Mai', content: 'Follow để cập nhật tin tức mới nhất nhé mọi người', sentiment: 'neutral', likes: 67, time: '5h ago' },
    { id: `${postId}-c7`, author: 'Quang Huy', content: 'Nguồn tin đáng tin cậy, đã xác minh', sentiment: 'positive', likes: 198, time: '5h ago' },
    { id: `${postId}-c8`, author: 'Hồng Nhung', content: 'Fake news đây mà, đừng tin', sentiment: 'negative', likes: 420, time: '6h ago' },
    { id: `${postId}-c9`, author: 'Bảo Long', content: 'Cập nhật thêm thông tin đi admin ơi', sentiment: 'neutral', likes: 34, time: '6h ago' },
    { id: `${postId}-c10`, author: 'Yến Nhi', content: 'Xem xong mà stress quá 😢', sentiment: 'negative', likes: 178, time: '7h ago' },
    { id: `${postId}-c11`, author: 'Thanh Tùng', content: 'Phân tích sâu sắc, rất có giá trị!', sentiment: 'positive', likes: 256, time: '8h ago' },
    { id: `${postId}-c12`, author: 'Khánh Ly', content: 'Nội dung quá nhàm chán, không có gì mới', sentiment: 'negative', likes: 12, time: '9h ago' },
  ];
  return pool;
}

/* ── Stalker mock data ── */

export interface StalkerAlert {
  id: string;
  type: 'new_post' | 'comment_spike' | 'engagement_threshold' | 'sentiment_shift';
  title: string;
  description: string;
  time: string;
  severity: 'info' | 'warning' | 'critical';
  read: boolean;
}

export interface StalkerTarget {
  id: string;
  type: 'profile' | 'post';
  platform: Platform;
  name: string;
  url: string;
  status: 'active' | 'paused';
  lastChecked: string;
  totalAlerts: number;
  thresholds: {
    newPost: boolean;
    commentSentiment: number; // % negative threshold
    engagementThreshold: number;
  };
  alerts: StalkerAlert[];
}

export const mockStalkers: StalkerTarget[] = [
  {
    id: 'stk-1',
    type: 'profile',
    platform: 'tiktok',
    name: '@competitor_brand',
    url: 'tiktok.com/@competitor_brand',
    status: 'active',
    lastChecked: '2 min ago',
    totalAlerts: 8,
    thresholds: { newPost: true, commentSentiment: 50, engagementThreshold: 5000 },
    alerts: [
      { id: 'a1', type: 'new_post', title: 'New post detected', description: '"Sản phẩm mới mùa hè 2026 chính thức ra mắt..."', time: '3h ago', severity: 'info', read: false },
      { id: 'a2', type: 'comment_spike', title: 'Comment spike — 67% negative', description: '142 new comments, negative sentiment dominant', time: '5h ago', severity: 'critical', read: false },
      { id: 'a3', type: 'engagement_threshold', title: 'Engagement threshold reached', description: '5.2K likes on latest post', time: '12h ago', severity: 'warning', read: true },
      { id: 'a4', type: 'new_post', title: 'New post detected', description: '"Review sản phẩm từ khách hàng thực tế..."', time: '1d ago', severity: 'info', read: true },
      { id: 'a5', type: 'sentiment_shift', title: 'Sentiment shift detected', description: 'Overall sentiment dropped from 72% to 45%', time: '2d ago', severity: 'critical', read: true },
    ],
  },
  {
    id: 'stk-2',
    type: 'profile',
    platform: 'facebook',
    name: 'Đối thủ ABC Official',
    url: 'facebook.com/doithuabc',
    status: 'active',
    lastChecked: '15 min ago',
    totalAlerts: 3,
    thresholds: { newPost: true, commentSentiment: 40, engagementThreshold: 10000 },
    alerts: [
      { id: 'a6', type: 'new_post', title: 'New post detected', description: '"Chương trình khuyến mãi tháng 4..."', time: '1h ago', severity: 'info', read: false },
      { id: 'a7', type: 'engagement_threshold', title: 'Engagement threshold reached', description: '12.5K reactions on campaign post', time: '6h ago', severity: 'warning', read: true },
      { id: 'a8', type: 'new_post', title: 'New post detected', description: '"Tuyển dụng vị trí Marketing Manager..."', time: '1d ago', severity: 'info', read: true },
    ],
  },
  {
    id: 'stk-3',
    type: 'post',
    platform: 'youtube',
    name: 'Top 10 sản phẩm tốt nhất 2026',
    url: 'youtube.com/watch?v=xyz789',
    status: 'active',
    lastChecked: '8 min ago',
    totalAlerts: 5,
    thresholds: { newPost: false, commentSentiment: 60, engagementThreshold: 1000 },
    alerts: [
      { id: 'a9', type: 'comment_spike', title: 'Comment spike — 54% negative', description: '89 new comments in last hour', time: '30min ago', severity: 'warning', read: false },
      { id: 'a10', type: 'engagement_threshold', title: 'View milestone', description: '100K views reached', time: '2h ago', severity: 'info', read: true },
    ],
  },
  {
    id: 'stk-4',
    type: 'profile',
    platform: 'tiktok',
    name: '@influencer_review',
    url: 'tiktok.com/@influencer_review',
    status: 'paused',
    lastChecked: '3 days ago',
    totalAlerts: 12,
    thresholds: { newPost: true, commentSentiment: 50, engagementThreshold: 2000 },
    alerts: [
      { id: 'a11', type: 'new_post', title: 'New post detected', description: '"Honest review sản phẩm brand X..."', time: '3d ago', severity: 'info', read: true },
    ],
  },
];

/* ── Reports mock data ── */

export interface ReportItem {
  id: string;
  title: string;
  type: 'campaign' | 'project' | 'competitor';
  scope: string;
  generatedAt: string;
  pages: number;
  format: 'PDF' | 'CSV';
  status: 'ready' | 'generating' | 'failed';
  sections: string[];
}

export const mockReports: ReportItem[] = [
  {
    id: 'rpt-1',
    title: 'Iran Conflict Monitoring — Full Report',
    type: 'campaign',
    scope: 'All projects, all keywords',
    generatedAt: '2026-04-14 09:30',
    pages: 24,
    format: 'PDF',
    status: 'ready',
    sections: ['Overview', 'Sentiment Analysis', 'Trends', 'Top Posts', 'Platform Breakdown'],
  },
  {
    id: 'rpt-2',
    title: 'Competitor Analysis — @brand_x',
    type: 'competitor',
    scope: 'tiktok.com/@brand_x, facebook.com/brandx',
    generatedAt: '2026-04-12 14:15',
    pages: 12,
    format: 'PDF',
    status: 'ready',
    sections: ['Engagement Analysis', 'Content Strategy', 'Sentiment Breakdown'],
  },
  {
    id: 'rpt-3',
    title: 'Entertainment & Culture — Weekly',
    type: 'campaign',
    scope: 'Music & Artists project',
    generatedAt: '2026-04-10 08:00',
    pages: 8,
    format: 'PDF',
    status: 'ready',
    sections: ['Overview', 'Trends', 'Top Posts'],
  },
  {
    id: 'rpt-4',
    title: 'Tech & Innovation — Q1 Summary',
    type: 'project',
    scope: 'AI & Tech, VinFast & EV',
    generatedAt: '2026-04-01 10:00',
    pages: 18,
    format: 'PDF',
    status: 'ready',
    sections: ['Overview', 'Sentiment Analysis', 'Trends', 'Platform Breakdown', 'Recommendations'],
  },
];
