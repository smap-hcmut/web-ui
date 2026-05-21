/**
 * GET /api/analytics/posts/export?campaignId=xxx&format=csv|svg
 *
 * Exports the full filtered Top Mentions by Platform result set from
 * analysis-api. It preserves the same filter contract as /api/analytics/posts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    return proxyAnalysis(request, '/api/v1/analytics/posts/export');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/posts/export]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
