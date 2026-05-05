/**
 * GET /api/analytics/project-stats?campaignId=xxx
 *
 * Returns per-project analytics for all projects in a campaign:
 * - mentions (count)
 * - avgSentiment (0-100)
 * - platforms (distinct list)
 *
 * Used by ProjectCardsRow to populate flip cards with real data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { proxyAnalysis } from '@/lib/analysis/client';
import { IS_MOCK, mockProjectStats } from '@/lib/mock';

export interface ProjectStat {
  project_id: string;
  mentions: number;
  avg_sentiment: number;
  platforms: string[];
}

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    if (IS_MOCK) return NextResponse.json(mockProjectStats);

    return proxyAnalysis(request, '/api/v1/analytics/project-stats');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[analytics/project-stats]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
