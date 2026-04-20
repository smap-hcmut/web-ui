/**
 * POST /api/proxy/reports/api/v1/{reportId}/cancel
 * Mock: flip an in-flight job to `cancelled`.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cancelReport } from '@/lib/mock/reports-store';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const r = cancelReport(reportId);
  if (!r) {
    return NextResponse.json(
      { error_code: 1, message: 'report not found' },
      { status: 404 },
    );
  }
  return NextResponse.json({
    error_code: 0,
    message: 'ok',
    data: { ok: true },
  });
}
