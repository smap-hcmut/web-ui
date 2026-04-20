/**
 * POST /api/proxy/reports/api/v1/{reportId}/retry
 * Mock: restart a failed/cancelled job; returns new processId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { retryReport } from '@/lib/mock/reports-store';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const result = retryReport(reportId);
  if (!result) {
    return NextResponse.json(
      { error_code: 1, message: 'report not found' },
      { status: 404 },
    );
  }
  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: { processId: result.processId },
  });
}
