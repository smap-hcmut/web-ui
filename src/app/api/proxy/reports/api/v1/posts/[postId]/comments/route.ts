/**
 * GET /api/proxy/reports/api/v1/posts/{postId}/comments?page=&page_size=
 * Mock: lazy-loaded comment thread for a single post.
 */

import { NextRequest, NextResponse } from 'next/server';
import { makeCommentsFor } from '@/lib/mock/reports-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? 1));
  const pageSize = Math.max(1, Math.min(200, Number(request.nextUrl.searchParams.get('page_size') ?? 50)));

  const all = makeCommentsFor(postId);
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: { items, total: all.length, page, pageSize },
  });
}
