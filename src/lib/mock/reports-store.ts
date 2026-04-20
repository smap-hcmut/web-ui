/**
 * In-memory mock store for the reports API.
 *
 * Lives on globalThis so it survives Next.js hot-module reload in dev.
 * Delete this file (and the route handlers under /app/api/proxy/reports/*)
 * when the real reports-srv backend is ready.
 */

import type {
  CrawlerCompetitorProgress,
  CrawlerProcess,
  CrawlerStatus,
  Platform,
  ReportComment,
  ReportItem,
  ReportPost,
} from '@/lib/types';
import { detectPlatform } from '@/lib/utils/platform';

interface Store {
  reports: Map<string, ReportItem>;
  posts: Map<string, ReportPost[]>;
  comments: Map<string, ReportComment[]>;
}

const g = globalThis as unknown as { __smapReportsMock?: Store };

function createStore(): Store {
  return {
    reports: new Map(),
    posts: new Map(),
    comments: new Map(),
  };
}

if (!g.__smapReportsMock) {
  g.__smapReportsMock = createStore();
}

export const store: Store = g.__smapReportsMock;

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const sentiments: ReportPost['sentiment'][] = ['positive', 'neutral', 'negative'];

const sampleAuthors = [
  'Minh Nguyen', 'Thu Pham', 'Hoang Tran', 'Linh Le', 'Duc Vo',
  'An Pham', 'Quang Nguyen', 'Mai Bui', 'Tien Do', 'Khanh Hoang',
];

const sampleTitles = [
  'Review chi tiết sản phẩm mới — trải nghiệm sau 1 tuần',
  'So sánh giá giữa các platform, bất ngờ nhất là...',
  'Unboxing hàng hot tháng này, ai đã order chưa?',
  'Mẹo dùng hiệu quả mà ít người biết',
  'Cộng đồng đang bàn tán gì về đợt khuyến mãi này',
  'Top 5 lý do sản phẩm này đang viral',
  'Trải nghiệm thực tế — liệu có xứng đáng với giá tiền?',
  'Phản hồi từ khách hàng sau 1 tháng sử dụng',
];

const sampleKeywords = [
  ['giá', 'khuyến mãi', 'chất lượng'],
  ['trải nghiệm', 'review', 'đánh giá'],
  ['unboxing', 'hot trend', 'viral'],
  ['so sánh', 'lựa chọn', 'tư vấn'],
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Factories ───────────────────────────────────────────────────────────────

export function makeReport(input: {
  campaignId: string;
  competitorUrls: string[];
  platforms: Platform[];
  sections: string[];
  maxPostsPerCompetitor: number;
}): ReportItem {
  const id = uid('rpt');
  const processId = uid('proc');

  const perCompetitor: CrawlerCompetitorProgress[] = input.competitorUrls.map((url) => ({
    url,
    platform: detectPlatform(url) ?? input.platforms[0] ?? 'tiktok',
    crawled: 0,
    target: input.maxPostsPerCompetitor,
    status: 'pending',
  }));

  const process: CrawlerProcess = {
    processId,
    status: 'pending',
    startedAt: new Date().toISOString(),
    progress: {
      crawled: 0,
      target: input.maxPostsPerCompetitor * input.competitorUrls.length,
      perCompetitor,
    },
  };

  const report: ReportItem = {
    id,
    title: `Competitor report · ${new Date().toLocaleDateString('vi-VN')}`,
    type: 'competitor',
    scope: `${input.competitorUrls.length} competitor${input.competitorUrls.length > 1 ? 's' : ''}`,
    generatedAt: new Date().toISOString(),
    pages: 0,
    format: 'PDF',
    status: 'generating',
    sections: input.sections,
    campaignId: input.campaignId,
    competitorUrls: input.competitorUrls,
    platforms: input.platforms,
    maxPostsPerCompetitor: input.maxPostsPerCompetitor,
    process,
    totals: { posts: 0, comments: 0 },
  };

  store.reports.set(id, report);
  return report;
}

/**
 * Advance the crawler progress based on elapsed wall-clock time.
 * Simulates a realistic crawl: ~20 posts/second spread across competitors.
 * When all competitors finish, flips status to 'done' and materialises posts.
 */
export function tickProcess(reportId: string): ReportItem | null {
  const report = store.reports.get(reportId);
  if (!report || !report.process) return report ?? null;
  const p = report.process;
  if (p.status === 'done' || p.status === 'failed' || p.status === 'cancelled') return report;

  const startedMs = Date.parse(p.startedAt);
  const elapsedSec = (Date.now() - startedMs) / 1000;
  const POSTS_PER_SEC = 25;
  const totalTarget = p.progress.target;
  const desiredCrawled = Math.min(totalTarget, Math.floor(elapsedSec * POSTS_PER_SEC));

  // Spread the crawled count across competitors round-robin
  const perList = p.progress.perCompetitor.map((c) => ({ ...c }));
  let remaining = desiredCrawled;
  for (const c of perList) {
    const take = Math.min(c.target, remaining);
    c.crawled = take;
    remaining -= take;
    c.status = c.crawled === 0 ? 'pending' : c.crawled >= c.target ? 'done' : 'running';
  }

  const newStatus: CrawlerStatus =
    desiredCrawled >= totalTarget ? 'done' : desiredCrawled > 0 ? 'running' : 'pending';

  report.process = {
    ...p,
    status: newStatus,
    progress: {
      ...p.progress,
      crawled: desiredCrawled,
      perCompetitor: perList,
    },
    finishedAt: newStatus === 'done' ? new Date().toISOString() : p.finishedAt,
  };

  if (newStatus === 'done') {
    report.status = 'ready';
    materialisePosts(report);
  }

  store.reports.set(reportId, report);
  return report;
}

function materialisePosts(report: ReportItem) {
  if (store.posts.has(report.id)) return;
  const posts: ReportPost[] = [];
  let totalComments = 0;

  for (const comp of report.process?.progress.perCompetitor ?? []) {
    for (let i = 0; i < comp.crawled; i++) {
      const postId = uid('post');
      const commentCount = randInt(0, 80);
      totalComments += commentCount;
      const sentiment = pick(sentiments);

      posts.push({
        id: postId,
        reportId: report.id,
        competitorUrl: comp.url,
        platform: comp.platform,
        author: pick(sampleAuthors),
        content: pick(sampleTitles),
        postedAt: new Date(Date.now() - randInt(1, 30 * 24 * 3600) * 1000).toISOString(),
        url: `${comp.url}/post/${postId}`,
        engagement: {
          likes: randInt(50, 50000),
          comments: commentCount,
          shares: randInt(0, 2000),
          views: randInt(1000, 500000),
        },
        sentiment,
        commentCount,
        reactions: {
          like: randInt(50, 20000),
          love: randInt(10, 5000),
          haha: randInt(0, 2000),
          wow: randInt(0, 500),
          sad: randInt(0, 200),
          angry: randInt(0, 100),
        },
        sentimentBreakdown: {
          positive: randInt(20, 80),
          neutral: randInt(10, 40),
          negative: randInt(0, 30),
        },
        topKeywords: pick(sampleKeywords),
      });
    }
  }

  store.posts.set(report.id, posts);
  report.totals = { posts: posts.length, comments: totalComments };
  report.pages = Math.ceil(posts.length / 20);
}

export function makeCommentsFor(postId: string): ReportComment[] {
  if (store.comments.has(postId)) return store.comments.get(postId)!;
  const post = Array.from(store.posts.values()).flat().find((p) => p.id === postId);
  const n = post?.commentCount ?? randInt(0, 40);
  const comments: ReportComment[] = [];
  for (let i = 0; i < n; i++) {
    const hasReplies = Math.random() > 0.7;
    comments.push({
      id: uid('cmt'),
      postId,
      author: pick(sampleAuthors),
      content: pick([
        'Sản phẩm này tuyệt vời, mình đã dùng 1 tháng rồi.',
        'Không đáng giá tiền đâu, có nhiều lựa chọn khác tốt hơn.',
        'Đang phân vân không biết có nên mua không?',
        'Đã mua và rất hài lòng với chất lượng.',
        'Giá hơi cao so với các sản phẩm tương tự.',
        'Design đẹp nhưng tính năng chưa đủ hấp dẫn.',
      ]),
      sentiment: pick(sentiments),
      likes: randInt(0, 500),
      time: new Date(Date.now() - randInt(0, 7 * 24 * 3600) * 1000).toISOString(),
      replies: hasReplies
        ? Array.from({ length: randInt(1, 3) }).map(() => ({
            id: uid('cmt'),
            author: pick(sampleAuthors),
            content: pick([
              'Mình cũng nghĩ vậy.',
              'Bạn có thể share link được không?',
              'Không đồng ý, mình có trải nghiệm khác.',
            ]),
            sentiment: pick(sentiments),
            likes: randInt(0, 50),
            time: new Date().toISOString(),
          }))
        : undefined,
    });
  }
  store.comments.set(postId, comments);
  return comments;
}

export function listReports(campaignId: string): ReportItem[] {
  return Array.from(store.reports.values())
    .filter((r) => r.campaignId === campaignId)
    .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
}

export function cancelReport(reportId: string): ReportItem | null {
  const r = store.reports.get(reportId);
  if (!r || !r.process) return r ?? null;
  if (r.process.status === 'done') return r;

  r.status = 'cancelled';
  r.process = {
    ...r.process,
    status: 'cancelled',
    finishedAt: new Date().toISOString(),
    progress: {
      ...r.process.progress,
      perCompetitor: r.process.progress.perCompetitor.map((c) =>
        c.status === 'running' || c.status === 'pending'
          ? { ...c, status: 'cancelled' }
          : c,
      ),
    },
  };
  store.reports.set(reportId, r);
  return r;
}

export function retryReport(reportId: string): { report: ReportItem; processId: string } | null {
  const r = store.reports.get(reportId);
  if (!r) return null;
  const processId = uid('proc');
  const target = (r.maxPostsPerCompetitor ?? 50) * (r.competitorUrls?.length ?? 1);

  r.status = 'generating';
  r.errorMessage = undefined;
  r.process = {
    processId,
    status: 'pending',
    startedAt: new Date().toISOString(),
    progress: {
      crawled: 0,
      target,
      perCompetitor: (r.competitorUrls ?? []).map((url) => ({
        url,
        platform: detectPlatform(url) ?? 'tiktok',
        crawled: 0,
        target: r.maxPostsPerCompetitor ?? 50,
        status: 'pending',
      })),
    },
  };
  store.posts.delete(reportId);
  store.reports.set(reportId, r);
  return { report: r, processId };
}
