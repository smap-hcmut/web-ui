/**
 * POST /api/proxy/reports/api/v1/competitor
 * Mock handler: registers a crawler job and returns { reportId, processId }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { makeReport } from '@/lib/mock/reports-store';
import type { Platform } from '@/lib/types';

interface Body {
  campaign_id: string;
  competitor_urls: string[];
  platforms: Platform[];
  sections: string[];
  max_posts_per_competitor: number;
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error_code: 1, message: 'invalid json' },
      { status: 400 },
    );
  }

  if (!body.campaign_id || !Array.isArray(body.competitor_urls) || body.competitor_urls.length === 0) {
    return NextResponse.json(
      { error_code: 1, message: 'campaign_id and competitor_urls required' },
      { status: 400 },
    );
  }

  const report = makeReport({
    campaignId: body.campaign_id,
    competitorUrls: body.competitor_urls,
    platforms: body.platforms ?? [],
    sections: body.sections ?? [],
    maxPostsPerCompetitor: Math.min(500, Math.max(1, body.max_posts_per_competitor ?? 50)),
  });

  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: {
      reportId: report.id,
      processId: report.process!.processId,
    },
  });
}
