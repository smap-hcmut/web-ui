export interface SuggestedQuestion {
  id: string;
  text: string;
  icon: string; // lucide icon name hint
}

export interface BotResponseBlock {
  type: 'text' | 'bullets' | 'stats';
  content?: string;
  items?: string[];
  stats?: { label: string; value: string; change?: number }[];
}

export interface MockBotResponse {
  trigger: string; // keyword to match in user message
  blocks: BotResponseBlock[];
}

export const suggestedQuestions: SuggestedQuestion[] = [
  { id: 'sq1', text: 'Tóm tắt sentiment tuần này', icon: 'bar-chart' },
  { id: 'sq2', text: 'Top 5 bài viết có engagement cao nhất', icon: 'trending-up' },
  { id: 'sq3', text: 'So sánh hiệu suất giữa các platform', icon: 'git-compare' },
  { id: 'sq4', text: 'Xu hướng keyword nổi bật', icon: 'hash' },
];

export const mockBotResponses: MockBotResponse[] = [
  {
    trigger: 'sentiment',
    blocks: [
      {
        type: 'text',
        content:
          'Dưới đây là tổng quan sentiment cho campaign trong 7 ngày qua:',
      },
      {
        type: 'stats',
        stats: [
          { label: 'Positive', value: '62%', change: 5.2 },
          { label: 'Neutral', value: '24%', change: -1.8 },
          { label: 'Negative', value: '14%', change: -3.4 },
        ],
      },
      {
        type: 'text',
        content:
          'Sentiment tích cực tăng đáng kể nhờ chiến dịch KOL mới trên TikTok. Lượng mention tiêu cực giảm 3.4% so với tuần trước.',
      },
    ],
  },
  {
    trigger: 'engagement',
    blocks: [
      {
        type: 'text',
        content: 'Top 5 bài viết có engagement cao nhất tuần này:',
      },
      {
        type: 'bullets',
        items: [
          '🥇 TikTok @creator_vn — 128K likes, 5.2K comments',
          '🥈 Facebook Fanpage — 45K reactions, 3.1K shares',
          '🥉 YouTube Review — 890K views, 12K likes',
          '4. TikTok @food_review — 67K likes, 2.8K comments',
          '5. Facebook Group Post — 23K reactions, 1.5K shares',
        ],
      },
      {
        type: 'text',
        content:
          'TikTok chiếm 3/5 vị trí top — khuyến nghị tăng budget cho platform này.',
      },
    ],
  },
  {
    trigger: 'platform',
    blocks: [
      {
        type: 'text',
        content: 'So sánh hiệu suất 3 platform chính trong 7 ngày qua:',
      },
      {
        type: 'stats',
        stats: [
          { label: 'TikTok', value: '18.2K mentions', change: 24.5 },
          { label: 'Facebook', value: '12.8K mentions', change: 8.1 },
          { label: 'YouTube', value: '7.2K mentions', change: -2.3 },
        ],
      },
      {
        type: 'text',
        content:
          'TikTok vẫn dẫn đầu về tốc độ tăng trưởng mention (+24.5%). YouTube giảm nhẹ do ít video mới từ KOLs chủ lực.',
      },
    ],
  },
  {
    trigger: 'keyword',
    blocks: [
      {
        type: 'text',
        content: 'Xu hướng keyword nổi bật tuần này:',
      },
      {
        type: 'bullets',
        items: [
          '"sản phẩm mới" — 4.2K mentions (+180%)',
          '"review thật" — 3.1K mentions (+95%)',
          '"mua ở đâu" — 2.8K mentions (+67%)',
          '"giá rẻ" — 2.1K mentions (+34%)',
          '"so sánh" — 1.9K mentions (+28%)',
        ],
      },
      {
        type: 'text',
        content:
          'Keyword "sản phẩm mới" bùng nổ mạnh nhờ TikTok trend. Nên tận dụng thời điểm này để đẩy content.',
      },
    ],
  },
];

/** Fallback response when no trigger matches */
export const fallbackResponse: BotResponseBlock[] = [
  {
    type: 'text',
    content:
      'Cảm ơn bạn! Tôi đã ghi nhận câu hỏi. Dưới đây là một số thông tin tổng quan:',
  },
  {
    type: 'stats',
    stats: [
      { label: 'Total Mentions', value: '38,247', change: 18.3 },
      { label: 'Engagement Rate', value: '4.8%', change: 2.1 },
      { label: 'Sentiment Score', value: '72/100', change: 5.0 },
    ],
  },
  {
    type: 'text',
    content:
      'Bạn có thể hỏi cụ thể hơn về sentiment, engagement, platform hoặc keyword để tôi phân tích chi tiết hơn.',
  },
];

/** Find best matching response based on user message keywords */
export function findBotResponse(userMessage: string): BotResponseBlock[] {
  const lower = userMessage.toLowerCase();
  for (const resp of mockBotResponses) {
    if (lower.includes(resp.trigger)) {
      return resp.blocks;
    }
  }
  return fallbackResponse;
}

/** CSV template columns for social listening data import */
export const csvTemplateHeaders = [
  'platform',
  'post_url',
  'author',
  'content',
  'timestamp',
  'likes',
  'comments',
  'shares',
  'sentiment',
];

export const csvTemplateSampleRows = [
  [
    'tiktok',
    'https://tiktok.com/@user/video/123',
    '@creator_vn',
    'Review sản phẩm mới cực kỳ chất lượng!',
    '2026-04-10T14:30:00Z',
    '12500',
    '340',
    '890',
    'positive',
  ],
  [
    'facebook',
    'https://facebook.com/post/456',
    'Nguyễn Văn A',
    'Mình đã thử và thấy khá ổn, giá hơi cao.',
    '2026-04-11T09:15:00Z',
    '450',
    '67',
    '23',
    'neutral',
  ],
  [
    'youtube',
    'https://youtube.com/watch?v=abc',
    'TechReviewVN',
    'So sánh chi tiết với đối thủ — kết quả bất ngờ!',
    '2026-04-12T18:00:00Z',
    '8900',
    '512',
    '145',
    'positive',
  ],
];

/** Generate CSV string for template download */
export function generateCSVTemplate(): string {
  const header = csvTemplateHeaders.join(',');
  const rows = csvTemplateSampleRows.map((row) =>
    row.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(',')
  );
  return [header, ...rows].join('\n');
}
