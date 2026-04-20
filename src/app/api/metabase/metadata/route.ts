/**
 * GET /api/metabase/metadata
 *
 * Fetch table & column metadata from smap-database (database_id = 2).
 */

import { NextResponse } from 'next/server';
import { fetchMetabase } from '@/lib/metabase/client';

export async function GET() {
  try {
    const res = await fetchMetabase('/api/database/2/metadata?include_hidden=false');

    if (!res.ok) {
      throw new Error(`Metabase metadata failed: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
