/**
 * GET /api/analytics/kpis?campaignId=xxx
 *
 * Returns 4 KPI metrics for a campaign:
 * - Total Mentions (count)
 * - Sentiment Score (avg 0-100)
 * - Engagement (sum from uap_metadata)
 * - Audience Reach (sum reach_estimate)
 *
 * Each KPI includes: value, change%, 12-point sparkline
 * Also returns engagement breakdown: views, likes, comments, shares
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';
import { IS_MOCK, mockKPIs } from '@/lib/mock';

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockKPIs);

    return proxyAnalysis(request, '/api/v1/analytics/kpis');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/kpis]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
