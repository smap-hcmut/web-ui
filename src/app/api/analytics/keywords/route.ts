/**
 * GET /api/analytics/keywords?campaignId=xxx&limit=50
 *
 * Returns trending keywords data:
 * - Ranked list: keyword text, volume (count), sentiment, change%
 * - Word cloud: text, value, color, opacity (sentiment-based)
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';
import { IS_MOCK, mockKeywords } from '@/lib/mock';

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    const limit = Number(request.nextUrl.searchParams.get('limit') || '50');

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) {
      return NextResponse.json({
        keywords: mockKeywords.keywords.slice(0, limit),
        wordCloud: mockKeywords.wordCloud,
      });
    }

    return proxyAnalysis(request, '/api/v1/analytics/keywords');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/keywords]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
