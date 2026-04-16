/**
 * GET /api/metabase/cards
 *
 * Proxy to Metabase API to list saved questions (cards).
 * Runs server-side so the internal Metabase IP is reachable.
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

  if (!res.ok) {
    throw new Error(`Metabase auth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedSession = {
    id: data.id,
    expiresAt: Date.now() + 13 * 24 * 60 * 60 * 1000, // 13 days (Metabase default 14d)
  };

  return data.id;
}

export async function GET() {
  try {
    const sessionId = await getSession();

    const res = await fetch(`${API_CONFIG.METABASE.URL}/api/card`, {
      headers: {
        'X-Metabase-Session': sessionId,
      },
    });

    if (!res.ok) {
      // Session expired — clear cache and retry once
      if (res.status === 401) {
        cachedSession = null;
        const retrySession = await getSession();
        const retry = await fetch(`${API_CONFIG.METABASE.URL}/api/card`, {
          headers: { 'X-Metabase-Session': retrySession },
        });
        if (!retry.ok) throw new Error(`Metabase cards failed: ${retry.status}`);
        const retryCards = await retry.json();
        const smapRetryCards = retryCards.filter((c: Record<string, unknown>) => c.database_id === 2);
        return NextResponse.json(smapRetryCards);
      }
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
