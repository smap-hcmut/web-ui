/**
 * GET /api/metabase/cards
 *
 * Proxy to Metabase API to list saved questions (cards).
 * Runs server-side so the internal Metabase IP is reachable.
 */

import { NextResponse } from 'next/server';
import { fetchMetabase } from '@/lib/metabase/client';

export async function GET() {
  try {
    const res = await fetchMetabase('/api/card');

    if (!res.ok) {
      throw new Error(`Metabase cards failed: ${res.status}`);
    }

    const cards = await res.json();
    // Only return cards from smap-database (database_id = 2)
    const smapCards = cards.filter((c: Record<string, unknown>) => c.database_id === 2);
    return NextResponse.json(smapCards);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
