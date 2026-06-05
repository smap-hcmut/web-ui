/**
 * Central mock fixtures for offline UI debugging.
 * Enabled via NEXT_PUBLIC_MOCK_API=1. One demo campaign with deterministic data.
 */

const MOCK_CAMPAIGN_ID = 'mock-camp-1';
const NOW = '2026-04-21T10:00:00Z';

// ── Deterministic seeded helpers ─────────────────────────────────────────────
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ── Campaign / Projects (project-srv) ────────────────────────────────────────
const mockCampaign = {
  id: MOCK_CAMPAIGN_ID,
  name: 'Brand Watch Q2',
  description: 'Demo campaign for offline UI debugging',
  status: 'ACTIVE' as const,
  is_favorite: true,
  start_date: '2026-04-01',
  end_date: '2026-06-30',
  created_by: 'mock-user',
  created_at: '2026-04-01T00:00:00Z',
  updated_at: NOW,
};

const mockCampaignListResponse = {
  campaigns: [mockCampaign],
  paginator: { page: 1, limit: 20, total: 1 },
};

const mockProjects = [
  {
    id: 'mock-proj-1',
    campaign_id: MOCK_CAMPAIGN_ID,
    name: 'Brand Product',
    description: 'Our flagship product line',
    brand: 'Acme',
    entity_type: 'product' as const,
    entity_name: 'Acme Pro',
    domain_type_code: 'consumer-electronics',
    status: 'ACTIVE' as const,
    is_favorite: true,
    created_by: 'mock-user',
    created_at: '2026-04-02T00:00:00Z',
    updated_at: NOW,
  },
  {
    id: 'mock-proj-2',
    campaign_id: MOCK_CAMPAIGN_ID,
    name: 'Main Competitor',
    description: 'Tracking competitor launches',
    brand: 'Rival',
    entity_type: 'competitor' as const,
    entity_name: 'Rival X',
    domain_type_code: 'consumer-electronics',
    status: 'ACTIVE' as const,
    is_favorite: false,
    created_by: 'mock-user',
    created_at: '2026-04-03T00:00:00Z',
    updated_at: NOW,
  },
  {
    id: 'mock-proj-3',
    campaign_id: MOCK_CAMPAIGN_ID,
    name: 'Industry Trend',
    description: 'Broad industry conversation',
    entity_type: 'topic' as const,
    entity_name: 'smart home',
    status: 'ACTIVE' as const,
    is_favorite: false,
    created_by: 'mock-user',
    created_at: '2026-04-04T00:00:00Z',
    updated_at: NOW,
  },
];

const mockProjectListResponse = {
  projects: mockProjects,
  paginator: { total: mockProjects.length, page: 1, limit: 20, total_pages: 1 },
};

// ── Analytics: KPIs ──────────────────────────────────────────────────────────
export const mockKPIs = {
  metrics: [
    { label: 'Total Mentions', value: 24580, formatted: '24.6K', change: 12.4,
      sparkline: [180, 210, 195, 240, 260, 245, 290, 320, 305, 340, 360, 380], icon: 'mentions' },
    { label: 'Sentiment Score', value: 78, formatted: '78', change: 4.2,
      sparkline: [70, 72, 71, 74, 75, 73, 76, 77, 76, 78, 79, 78], icon: 'sentiment', suffix: '%' },
    { label: 'Engagement', value: 156300, formatted: '156.3K', change: 8.7,
      sparkline: [1100, 1250, 1180, 1320, 1400, 1380, 1450, 1520, 1490, 1580, 1620, 1650], icon: 'engagement' },
    { label: 'Audience Reach', value: 892000, formatted: '892K', change: -2.1,
      sparkline: [7600, 7800, 7550, 7900, 8100, 7950, 8050, 8200, 8050, 8150, 8100, 8050], icon: 'reach' },
  ],
  engagement: { views: 2985000, likes: 155800, comments: 18920, shares: 7800 },
};

// ── Analytics: Platform stats ────────────────────────────────────────────────
const months12 = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

export const mockPlatformStats = {
  stats: [
    { platform: 'TIKTOK', name: 'TikTok', mentions: 12400, mentionsChange: 18,
      engagement: '84.2K', engagementRaw: 84200, sentiment: 81, reach: 450000,
      status: 'active' as const, color: 'var(--platform-tiktok)' },
    { platform: 'FACEBOOK', name: 'Facebook', mentions: 7820, mentionsChange: 6,
      engagement: '52.1K', engagementRaw: 52100, sentiment: 74, reach: 280000,
      status: 'active' as const, color: '#1877f2' },
    { platform: 'YOUTUBE', name: 'YouTube', mentions: 4360, mentionsChange: -3,
      engagement: '20.0K', engagementRaw: 20000, sentiment: 76, reach: 162000,
      status: 'active' as const, color: '#ff0000' },
  ],
  timeSeries: (() => {
    const rand = seeded(42);
    return [
      { label: 'TikTok',   color: 'var(--chart-1)', data: Array.from({ length: 12 }, (_, i) => Math.round(600 + i * 60 + rand() * 200)) },
      { label: 'Facebook', color: 'var(--chart-2)', data: Array.from({ length: 12 }, (_, i) => Math.round(500 + i * 20 + rand() * 150)) },
      { label: 'YouTube',  color: 'var(--chart-3)', data: Array.from({ length: 12 }, (_, i) => Math.round(300 + i * 10 + rand() * 120)) },
    ];
  })(),
  months: months12,
};

// ── Analytics: Sentiment ─────────────────────────────────────────────────────
export const mockSentiment = {
  donut: [
    { label: 'positive', value: 15620, color: 'var(--success)' },
    { label: 'neutral',  value: 6840,  color: 'var(--warning)' },
    { label: 'negative', value: 2120,  color: 'var(--danger)' },
  ],
  timeline: (() => {
    const rand = seeded(7);
    return [
      { label: 'TikTok',   color: 'var(--chart-1)', data: Array.from({ length: 12 }, () => Math.round(70 + rand() * 20)) },
      { label: 'Facebook', color: 'var(--chart-2)', data: Array.from({ length: 12 }, () => Math.round(65 + rand() * 18)) },
      { label: 'YouTube',  color: 'var(--chart-3)', data: Array.from({ length: 12 }, () => Math.round(72 + rand() * 16)) },
    ];
  })(),
  months: months12,
  pulse: 78,
  total: 24580,
};

// ── Analytics: Trending keywords ─────────────────────────────────────────────
const keywordsBase = [
  'smart home', 'voice assistant', 'battery life', 'setup easy', 'bad signal',
  'great price', 'customer support', 'design sleek', 'firmware bug', 'eco friendly',
  'noise reduction', 'app integration', 'subscription cost', 'fast charge', 'warranty',
  'ui smooth', 'hardware quality', 'comparison', 'tutorial', 'unboxing',
];

export const mockKeywords = {
  keywords: keywordsBase.map((text, i) => ({
    text,
    volume: Math.round(2400 - i * 110 + (i % 3) * 60),
    sentiment: 55 + ((i * 7) % 40),
    change: ((i * 13) % 40) - 15,
  })),
  wordCloud: keywordsBase.slice(0, 15).map((text, i) => ({
    text,
    value: 100 - i * 5,
    color: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--accent)'][i % 4],
    opacity: 0.55 + ((i % 5) * 0.09),
  })),
};

// ── Analytics: Posts ─────────────────────────────────────────────────────────
const PLATFORMS = ['TIKTOK', 'FACEBOOK', 'YOUTUBE'] as const;
const SENTIMENTS: Array<'positive' | 'neutral' | 'negative'> = ['positive', 'neutral', 'negative'];

const sampleContents = [
  'Vừa unbox con Acme Pro, cảm giác build rất chắc, pin trâu thật sự!',
  'Giá hơi cao so với Rival X nhưng camera thì đẹp hơn hẳn, ai đang phân vân cứ chốt nhé.',
  'Firmware update mới bị lag, ai gặp giống mình không?',
  'So sánh trực tiếp Acme vs Rival — video full trên channel mình.',
  'Customer support phản hồi khá nhanh, mình vừa gọi 15 phút là xong.',
  'Bao bì eco-friendly, điểm cộng cho hãng.',
  'Smart home integration hoạt động ngon với HomeKit, cực kỳ hài lòng.',
  'Setup hơi rối với người lớn tuổi, cần hướng dẫn rõ hơn.',
  'Fast charge đỉnh, 20 phút đầy nửa pin.',
  'Warranty 24 tháng là OK, nhưng policy đổi trả còn lằng nhằng.',
  'Review ngắn: đáng tiền với mức giá này.',
  'App mobile mượt hơn phiên bản trước, khen team dev.',
];

export const mockPostsAll = Array.from({ length: 36 }, (_, i) => {
  const rand = seeded(1000 + i);
  const platform = PLATFORMS[i % 3];
  const sentiment = SENTIMENTS[i % 3];
  const engagement = Math.round(2000 + rand() * 18000);
  return {
    id: `mock-post-${i + 1}`,
    platform,
    author: `user_${(i + 1).toString().padStart(2, '0')}`,
    authorUsername: `@user_${(i + 1).toString().padStart(2, '0')}`,
    authorFollowers: Math.round(500 + rand() * 50000),
    authorVerified: i % 7 === 0,
    content: sampleContents[i % sampleContents.length],
    time: `${(i % 23) + 1}h ago`,
    url: `https://example.com/post/${i + 1}`,
    sentiment,
    sentimentScore: sentiment === 'positive' ? 75 + (i % 20) : sentiment === 'negative' ? 20 + (i % 20) : 45 + (i % 15),
    engagement,
    views: Math.round(engagement * (10 + rand() * 20)),
    likes: Math.round(engagement * 0.55),
    comments: Math.round(engagement * 0.12),
    shares: Math.round(engagement * 0.05),
    keywords: Array.from({ length: 4 + (i % 11) }, (_, k) => keywordsBase[(i + k * 2) % keywordsBase.length]),
    riskLevel: sentiment === 'negative' ? 'medium' : 'low',
    hashtags: [`#${keywordsBase[i % keywordsBase.length].replace(/\s+/g, '')}`, '#review'],
  };
});

// ── Analytics: Project stats ─────────────────────────────────────────────────
export const mockProjectStats = {
  stats: [
    { project_id: 'mock-proj-1', mentions: 14200, avg_sentiment: 82, platforms: ['TIKTOK', 'FACEBOOK', 'YOUTUBE'] },
    { project_id: 'mock-proj-2', mentions: 6840,  avg_sentiment: 68, platforms: ['TIKTOK', 'YOUTUBE'] },
    { project_id: 'mock-proj-3', mentions: 3540,  avg_sentiment: 74, platforms: ['TIKTOK', 'FACEBOOK'] },
  ],
};

// ── Analytics: Heap tree ─────────────────────────────────────────────────────
export const mockHeap = {
  tree: {
    id: MOCK_CAMPAIGN_ID,
    type: 'campaign' as const,
    name: mockCampaign.name,
    metrics: { mentions: 24580, engagement: 156300, sentiment: 78, childCount: 3 },
    children: mockProjects.map((p, pi) => ({
      id: p.id,
      type: 'project' as const,
      name: p.name,
      metrics: {
        mentions: [14200, 6840, 3540][pi],
        engagement: [98000, 40000, 18300][pi],
        sentiment: [82, 68, 74][pi],
        childCount: 4,
      },
      children: Array.from({ length: 4 }, (_, ki) => {
        const kw = keywordsBase[(pi * 4 + ki) % keywordsBase.length];
        const rand = seeded(500 + pi * 10 + ki);
        return {
          id: `${p.id}-kw-${ki + 1}`,
          type: 'keyword' as const,
          name: kw,
          platform: PLATFORMS[ki % 3],
          metrics: {
            mentions: Math.round(800 + rand() * 3000),
            engagement: Math.round(4000 + rand() * 20000),
            sentiment: Math.round(60 + rand() * 30),
            childCount: 0,
          },
        };
      }),
    })),
  },
};

// ── Proxy matchers (GET only) ────────────────────────────────────────────────
type ProxyMatch = { test: (path: string) => boolean; body: unknown };

const proxyGetMatchers: ProxyMatch[] = [
  // Campaigns
  { test: (p) => p === '/project/api/v1/campaigns' || p.startsWith('/project/api/v1/campaigns?'),
    body: mockCampaignListResponse },
  { test: (p) => p === `/project/api/v1/campaigns/${MOCK_CAMPAIGN_ID}`,
    body: mockCampaign },
  { test: (p) => p === `/project/api/v1/campaigns/${MOCK_CAMPAIGN_ID}/projects` ||
                 p.startsWith(`/project/api/v1/campaigns/${MOCK_CAMPAIGN_ID}/projects?`),
    body: mockProjectListResponse },
  { test: (p) => p === '/project/api/v1/campaigns/favorites',
    body: { campaigns: [mockCampaign] } },
  // Projects
  { test: (p) => p === '/project/api/v1/projects' || p.startsWith('/project/api/v1/projects?'),
    body: mockProjectListResponse },
  ...mockProjects.map((pr) => ({
    test: (p: string) => p === `/project/api/v1/projects/${pr.id}`,
    body: pr,
  })),
  // Workspaces (return empty list so FE can render)
  { test: (p) => p === '/project/api/v1/workspaces' || p.startsWith('/project/api/v1/workspaces?'),
    body: { workspaces: [], paginator: { total: 0, page: 1, limit: 20 } } },
  // Datasources (empty)
  { test: (p) => p === '/ingest/api/v1/datasources' || p.startsWith('/ingest/api/v1/datasources?'),
    body: { datasources: [], paginator: { total: 0, page: 1, limit: 20 } } },
  // Reports list (empty)
  { test: (p) => p === '/reports/api/v1' || p.startsWith('/reports/api/v1?'),
    body: { data: [], total: 0 } },
];

/**
 * Return a mock body for a proxy GET path, or undefined if no match.
 */
export function matchProxyGet(path: string): unknown | undefined {
  const m = proxyGetMatchers.find((x) => x.test(path));
  return m?.body;
}
