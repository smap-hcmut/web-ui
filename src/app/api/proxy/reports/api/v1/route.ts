/**
 * GET /api/proxy/reports/api/v1?campaign_id=&page=&page_size=
 * Mock handler for listing reports. Shadows the catch-all proxy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listReports } from '@/lib/mock/reports-store';

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get('campaign_id');
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? 1));
  const pageSize = Math.max(1, Number(request.nextUrl.searchParams.get('page_size') ?? 50));

  if (!campaignId) {
    return NextResponse.json(
      { error_code: 1, message: 'campaign_id required' },
      { status: 400 },
    );
  }

  const all = listReports(campaignId);
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: { items, total: all.length, page, pageSize },
  });
}
