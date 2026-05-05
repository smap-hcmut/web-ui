/**
 * GET /api/analytics/heap?campaignId=xxx
 *
 * Returns hierarchical data for HeapSpace bubble visualization:
 * campaign → project → keyword → (aggregated post metrics)
 *
 * Each node has: name, type, metrics (mentions, engagement, sentiment, childCount)
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';
import { IS_MOCK, mockHeap } from '@/lib/mock';

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockHeap);

    return proxyAnalysis(request, '/api/v1/analytics/heap');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/heap]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
