/**
 * GET /api/proxy/reports/api/v1/{reportId}/posts?page=&page_size=&sentiment=&platform=
 * Mock: paginated post list for a done report.
 */

import { NextRequest, NextResponse } from 'next/server';
import { store, tickProcess } from '@/lib/mock/reports-store';
import type { Platform, ReportPost } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  tickProcess(reportId);

  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? 1));
  const pageSize = Math.max(1, Math.min(5000, Number(request.nextUrl.searchParams.get('page_size') ?? 20)));
  const sentiment = request.nextUrl.searchParams.get('sentiment') as ReportPost['sentiment'] | null;
  const platform = request.nextUrl.searchParams.get('platform') as Platform | null;

  let posts = store.posts.get(reportId) ?? [];
  if (sentiment) posts = posts.filter((p) => p.sentiment === sentiment);
  if (platform) posts = posts.filter((p) => p.platform === platform);

  const start = (page - 1) * pageSize;
  const items = posts.slice(start, start + pageSize);

  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: { items, total: posts.length, page, pageSize },
  });
}
