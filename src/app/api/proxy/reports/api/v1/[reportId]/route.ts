/**
 * GET /api/proxy/reports/api/v1/{reportId}
 * Mock: fetch a single report; advances its crawler tick as a side effect
 * so pages that don't poll /process still see freshness.
 */

import { NextRequest, NextResponse } from 'next/server';
import { store, tickProcess } from '@/lib/mock/reports-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  tickProcess(reportId);
  const report = store.reports.get(reportId);

  if (!report) {
    return NextResponse.json(
      { error_code: 1, message: 'report not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: report,
  });
}
