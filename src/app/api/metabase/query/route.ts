/**
 * POST /api/metabase/query
 *
 * Execute a Metabase saved question and return JSON results.
 * Body: { cardId: number }
 */

import { NextRequest, NextResponse } from 'next/server';
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
    expiresAt: Date.now() + 13 * 24 * 60 * 60 * 1000,
  };

  return data.id;
}

async function fetchWithRetry(url: string, sessionId: string): Promise<Response> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Metabase-Session': sessionId,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    cachedSession = null;
    const newSession = await getSession();
    return fetch(url, {
      method: 'POST',
      headers: {
        'X-Metabase-Session': newSession,
        'Content-Type': 'application/json',
      },
    });
  }

  return res;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const sessionId = await getSession();
    const url = `${API_CONFIG.METABASE.URL}/api/card/${cardId}/query/json`;
    const res = await fetchWithRetry(url, sessionId);

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
