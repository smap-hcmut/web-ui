/**
 * GET /api/analytics/platforms?campaignId=xxx
 *
 * Returns per-platform breakdown:
 * - mentions, engagement, sentiment, reach per platform
 * - 12-month time-series mentions per platform
 * - Radar chart data (5 axes per platform)
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';
import { IS_MOCK, mockPlatformStats } from '@/lib/mock';

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockPlatformStats);

    return proxyAnalysis(request, '/api/v1/analytics/platforms');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/platforms]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
