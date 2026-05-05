/**
 * GET /api/analytics/sentiment?campaignId=xxx
 *
 * Returns sentiment analysis data:
 * - Donut: positive/neutral/negative counts
 * - Timeline: monthly sentiment by platform (12 months)
 * - Pulse: overall average sentiment score (0-100)
 * - Distribution: histogram of sentiment scores
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';
import { IS_MOCK, mockSentiment } from '@/lib/mock';

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockSentiment);

    return proxyAnalysis(request, '/api/v1/analytics/sentiment');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/sentiment]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
