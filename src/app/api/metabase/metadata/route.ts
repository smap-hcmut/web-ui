/**
 * GET /api/metabase/metadata
 *
 * Fetch table & column metadata from smap-database (database_id = 2).
 */

import { NextResponse } from 'next/server';
import { API_CONFIG } from '@/lib/api/config';

let cachedSession: { id: string; expiresAt: number } | null = null;

async function getSession(): Promise<string> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession.id;
  }

  const username = process.env.METABASE_USERNAME;
  const password = process.env.METABASE_PASSWORD;

  if (!username || !password) {
    throw new Error('METABASE_USERNAME and METABASE_PASSWORD env vars required');
  }

  const res = await fetch(`${API_CONFIG.METABASE.URL}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error(`Metabase auth failed: ${res.status}`);

  const data = await res.json();
  cachedSession = {
    id: data.id,
    expiresAt: Date.now() + 13 * 24 * 60 * 60 * 1000,
  };
  return data.id;
}

export async function GET() {
  try {
    const sessionId = await getSession();

    const res = await fetch(
      `${API_CONFIG.METABASE.URL}/api/database/2/metadata?include_hidden=false`,
      { headers: { 'X-Metabase-Session': sessionId } }
    );

    if (!res.ok) {
      if (res.status === 401) {
        cachedSession = null;
        const retry = await getSession();
        const res2 = await fetch(
          `${API_CONFIG.METABASE.URL}/api/database/2/metadata?include_hidden=false`,
          { headers: { 'X-Metabase-Session': retry } }
        );
        if (!res2.ok) throw new Error(`Metabase metadata failed: ${res2.status}`);
        const data = await res2.json();
        return NextResponse.json(data);
      }
      throw new Error(`Metabase metadata failed: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
