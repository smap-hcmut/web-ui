/**
 * GET /api/proxy/reports/api/v1/{reportId}/process
 * Mock: advance progress and return the small crawler-process payload
 * used by the 3-second polling hook.
 */

import { NextRequest, NextResponse } from 'next/server';
import { tickProcess } from '@/lib/mock/reports-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const report = tickProcess(reportId);

  if (!report || !report.process) {
    return NextResponse.json(
      { error_code: 1, message: 'report or process not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: report.process,
  });
}
