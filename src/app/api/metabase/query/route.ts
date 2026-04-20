/**
 * POST /api/metabase/query
 *
 * Execute a Metabase saved question and return JSON results.
 * Body: { cardId: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchMetabase } from '@/lib/metabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const res = await fetchMetabase(`/api/card/${cardId}/query/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Metabase query failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
